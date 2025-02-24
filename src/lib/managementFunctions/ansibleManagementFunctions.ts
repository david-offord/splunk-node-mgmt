import type { AddOn, AnsibleVariableFile, Host } from "$lib/types.ts"
import { isNullOrUndefined, logDebug } from "$lib/utils";
import { exec } from 'child_process';
import * as utils from '$lib/utils'
import * as fs from "fs";
import path from "path";
import { log } from "console";
import { debugRefreshSplunk } from "./splunkManagementFunctions";

const BASE_DIRECTORY = '/home/dave/git_projects/splunk-node-mgmt';
const ANSIBLE_WORKING_DIRECTORY = '/workingdirectory/ansible';
const ANSIBLE_ADDONS_DIRECTORY = '/workingdirectory/addons';
const TEMP_EXTRACT_LOCATION = '/workingdirectory/temp';

export const deployAddonsToHost = async (host: Host, addons: AddOn[], logJobId: number = null) => {
    //define the folder to extract to
    let extract_folder = path.join(BASE_DIRECTORY, TEMP_EXTRACT_LOCATION, new Date().getTime().toString());
    //make the folder
    fs.mkdirSync(extract_folder, { recursive: true });

    let output: any = null;
    //extract all tar files to the folder
    for (let addon of addons) {
        try {

            //copy file to tmp
            await fs.copyFileSync(path.join(BASE_DIRECTORY, ANSIBLE_ADDONS_DIRECTORY, addon.addonFileLocation), path.join(extract_folder, addon.addonFileLocation));
            //extract it
            await utils.callCliFunction(`tar -xvf ${path.join(extract_folder, addon.addonFileLocation)}`, extract_folder);

            //split all the ignore paths
            let allRemovalFiles: string[] = addon.addonIgnoreFileOption?.split(',');

            //if there are any, remove them
            if (allRemovalFiles !== null && allRemovalFiles.length > 0 && allRemovalFiles[0] !== '') {
                for (let p of allRemovalFiles) {
                    //if it has any special directory paths
                    if (p.indexOf('..') > -1 || p.indexOf('~') > -1 || p.indexOf('!') > -1) {
                        continue;
                    }
                    //delete the files
                    await utils.callCliFunction(`rm -rf '${path.join(extract_folder, addon.addonFolderName, p)}'`, extract_folder);
                }
            }

            //add in a "managed by us" file
            fs.writeFileSync(path.join(extract_folder, addon.addonFolderName, 'managed_by_snm'), 'This file is managed by the Splunk Node Management Tool.Do not modify or delete.\n');
        }
        catch (ex) {
            utils.logError(`Error occurred deploying add-on ${addon?.displayName} to ${host.hostname}. Exception: ${ex}`, logJobId);
        }

    }

    //delete all the tar files in this folder
    await utils.callCliFunction(`rm -rf ${path.join(extract_folder, '*.tar.gz')}`, extract_folder);
    await utils.callCliFunction(`rm -rf ${path.join(extract_folder, '*.tgz')}`, extract_folder);
    await utils.callCliFunction(`rm -rf ${path.join(extract_folder, '*.spl')}`, extract_folder);

    //once all the add-ons are extracted, rsync them over to the machine
    let commandPrefix = `ansible ${host.ansibleName} -i inventory.yaml -b --vault-password-file .pass `;

    //do we need to restart? use this variable to determine it below
    let currentActionNeeded = 'none';

    //call the sync function for each add-on
    for (let addon of addons) {
        output = await callAnsibleFunction(`${commandPrefix} -m synchronize -a "checksum=True archive=True times=False src='${extract_folder}/${addon.addonFolderName}/'  dest=${host.splunkHomePath}/${addon.addonFolderName}/"`, BASE_DIRECTORY + ANSIBLE_WORKING_DIRECTORY);

        //parse out the ansible output
        let ansibleParsed = utils.parseAnsibleOutput(output.stdout);
        //if it was changed
        if (ansibleParsed?.status?.toLocaleLowerCase() !== 'success') {
            //if the add-on needs to be refreshed, and they haven't already said to restart
            if (addon.actionOnInstallation === 'refresh' && currentActionNeeded !== 'restart') {
                currentActionNeeded = 'refresh';
            }
            //if they say they need to restart, then restart
            else if (addon.actionOnInstallation === 'restart') {
                currentActionNeeded = 'restart';
            }
        }
    }

    //delete the temp folder
    fs.rmSync(extract_folder, { recursive: true });

    //restart/debug refresh if applicable
    if (currentActionNeeded === 'refresh') {
        utils.logInfo(`Debug Refreshing ${host.hostname} after deployment of apps...`, logJobId);
        await debugRefreshSplunk(host);
    }
    else if (currentActionNeeded === 'restart') {
        utils.logInfo(`Restarting Splunk on ${host.hostname} after deployment of apps...`, logJobId);
        output = await callAnsibleFunction(`${commandPrefix} -m shell -a "${host.splunkRestartCommand}"`, BASE_DIRECTORY + ANSIBLE_WORKING_DIRECTORY);
        logDebug(output.stdout?.replaceAll('\n', '\\n'));
    }

    //we finished!
    utils.logInfo(`Finished deploying add-ons to ${host.hostname}.`, logJobId);
}



export const deleteAddonsNoLongerManaged = async (host: Host, addons: AddOn[], logJobId: number = null) => {
    utils.logInfo(`Beginning check to delete add-ons removed within SNM for ${host.hostname}.`, logJobId);
    let commandPrefix = `ansible ${host.ansibleName} -i inventory.yaml -b --vault-password-file .pass `;
    //first things first, pull all the add-ons that are currently on the machine that WE manage
    let output = await callAnsibleFunction(`${commandPrefix} -m shell -a 'ls ${host.splunkHomePath}/*/managed_by_snm'`, BASE_DIRECTORY + ANSIBLE_WORKING_DIRECTORY);

    //if theres no stdout, there were no add-ons:
    if (output.stdout === '') {
        utils.logInfo(`No add-ons managed by SNM on ${host.hostname}.`, logJobId);
        return;
    }

    let ansibleParsed = utils.parseAnsibleOutput(output.stdout);

    if (ansibleParsed.ok === false) {
        utils.logError(`Error during parsing of ansible output! Message: ${JSON.stringify(ansibleParsed.message)}`, logJobId);
        return;
    }

    //split up the output
    let allManagedAddons: string[] = ansibleParsed.message?.split('\n').slice(1);
    let managedAddonNames: string[] = [];

    //extract the add-on name from the paths
    for (let addonOnMachine of allManagedAddons) {
        let addonSplit = addonOnMachine.split('/');

        if (addonSplit.length < 2)
            continue;

        managedAddonNames.push(addonSplit[addonSplit.length - 2]);
    }

    //now, compare the managed add-ons to the add-ons we have in the database
    for (let addonOnHost of managedAddonNames) {
        let indexOfHost = addons.findIndex((addon) => addon.addonFolderName === addonOnHost);

        if (indexOfHost === -1) {
            utils.logInfo(`Deleting ${addonOnHost} from ${host.hostname} as it is no longer managed by SNM.`, logJobId);
            //delete the add-on
            output = await callAnsibleFunction(`${commandPrefix} -m shell -a 'rm -rf ${host.splunkHomePath}/${addonOnHost}'`, BASE_DIRECTORY + ANSIBLE_WORKING_DIRECTORY);
        }

    }

    //we finished!
    utils.logInfo(`Finished deleting add-ons removed within SNM for ${host.hostname}.`, logJobId);

}











/**
 * Calls ansible function.
 * @param command 
 * @param cwd 
 * @returns 
 */
const callAnsibleFunction = async (command: string, cwd: string = BASE_DIRECTORY + ANSIBLE_WORKING_DIRECTORY) => {
    let out = "";
    let err = "";
    let ansiblePromise = new Promise<string>((resolve, reject) => {
        exec(command, {
            cwd: cwd
        }, (error, stdout, stderr) => {
            if (error) {
                err = `exec error: ${error}`;
                resolve(stdout);
            }
            out = stdout;
            err = stderr;
            resolve(stdout);
        });
    });
    await ansiblePromise;

    return { ok: isNullOrUndefined(err), stdout: out, stderr: err };
}