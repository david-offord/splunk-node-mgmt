import type { AddOn, AnsibleVariableFile, Host } from "$lib/types.ts"
import { isNullOrUndefined, logDebug } from "$lib/utils";
import { exec } from 'child_process';
import * as utils from '$lib/utils'
import * as fs from "fs";
import path from "path";
import { stderr } from "process";

const BASE_DIRECTORY = '/home/dave/git_projects/splunk-node-mgmt';
const ANSIBLE_WORKING_DIRECTORY = '/workingdirectory/ansible';
const ANSIBLE_ADDONS_DIRECTORY = '/workingdirectory/addons';
const TEMP_EXTRACT_LOCATION = '/workingdirectory/temp';

const REMOTE_BASE_DIRECTORY = '/opt/snm_tmp_folder';
const REMOTE_BASE_APP_COMPRESSED_DIRECTORY = REMOTE_BASE_DIRECTORY + '/apps';
const REMOTE_TEMP_EXTRACT_FOLDER = '/tmp/snm_tmp_folder';

export const deployAddonsToHost = async (host: Host, addons: AddOn[]) => {
    //define the folder to extract to
    let extract_folder = path.join(BASE_DIRECTORY, TEMP_EXTRACT_LOCATION, new Date().getTime().toString());
    //make the folder
    fs.mkdirSync(extract_folder, { recursive: true });

    let output: any = null;
    //extract all tar files to the folder
    for (let addon of addons) {
        //copy file to tmp
        await fs.copyFileSync(path.join(BASE_DIRECTORY, ANSIBLE_ADDONS_DIRECTORY, addon.addonFileLocation), path.join(extract_folder, addon.addonFileLocation));
        //extract it
        await utils.callCliFunction(`tar -xvf ${path.join(extract_folder, addon.addonFileLocation)}`, extract_folder);
    }

    return;

    let commandPrefix = `ansible ${host.ansibleName} -i inventory.yaml --vault-password-file .pass `;

    //create the wd folder in /opt
    output = await callAnsibleFunction(`${commandPrefix} -b -m file -a "path=${REMOTE_BASE_APP_COMPRESSED_DIRECTORY} state=directory"`);
    logDebug(output.stdout);
    output = await callAnsibleFunction(`${commandPrefix} -b -m file -a "path=${REMOTE_TEMP_EXTRACT_FOLDER} state=directory"`);
    logDebug(output.stdout);

    //for each addon, deploy it
    for (let addon of addons) {
        //copy the file
        output = await callAnsibleFunction(`ansible ${host.ansibleName} -i inventory.yaml -b --vault-password-file .pass ` +
            `-m copy -a "src='${BASE_DIRECTORY + ANSIBLE_ADDONS_DIRECTORY}/${addon.addonFileLocation}' ` +
            `dest=${REMOTE_BASE_APP_COMPRESSED_DIRECTORY}"`);
        logDebug(output.stdout);
    }


    //once we have deployed all the addons, we need to extract them
    //i do this down here cause I don't love the idea of having it copy, extract, copy, extract
    for (let addon of addons) {
        //copy the file
        output = await callAnsibleFunction(`ansible ${host.ansibleName} -i inventory.yaml -b --vault-password-file .pass ` +
            `-m unarchive -a "remote_src=true src='${REMOTE_BASE_APP_COMPRESSED_DIRECTORY}/${addon.addonFileLocation}' ` +
            `dest=${REMOTE_TEMP_EXTRACT_FOLDER}"`);
        logDebug(output.stdout);
    }

    //once we have deployed all the addons, we need to extract them
    //i do this down here cause I don't love the idea of having it copy, extract, copy, extract
    for (let addon of addons) {
        //copy the file
        output = await callAnsibleFunction(`ansible ${host.ansibleName} -i inventory.yaml -b --vault-password-file .pass ` +
            `-m unarchive -a "remote_src=true src='${REMOTE_BASE_APP_COMPRESSED_DIRECTORY}/${addon.addonFileLocation}' ` +
            `dest=${REMOTE_TEMP_EXTRACT_FOLDER}"`);
        logDebug(output.stdout);

        let allRemovalFiles: string[] = addon.addonIgnoreFileOption?.split(',');
        if (allRemovalFiles !== null && allRemovalFiles.length > 0 && allRemovalFiles[0] !== '') {
            for (let p of allRemovalFiles) {
                //if it has any special directory paths
                if (p.indexOf('..') > -1 || p.indexOf('~') > -1 || p.indexOf('!') > -1) {
                    continue;
                }
                //delete the files
                output = await callAnsibleFunction(`ansible ${host.ansibleName} -i inventory.yaml -b --vault-password-file .pass ` +
                    `-m shell -a "rm -rf '${path.join(REMOTE_TEMP_EXTRACT_FOLDER, addon.addonFolderName, p)}'"`);

            }
        }
    }

    //once we have deployed all the addons, we need to extract them
    //i do this down here cause I don't love the idea of having it copy, extract, copy, extract
    for (let addon of addons) {
        //copy the file
        output = await callAnsibleFunction(`ansible ${host.ansibleName} -i inventory.yaml -b --vault-password-file .pass ` +
            `-m copy -a "remote_src=true src='${path.join(REMOTE_TEMP_EXTRACT_FOLDER, addon.addonFolderName)}' ` +
            `dest=${host.splunkHomePath}"`);
        logDebug(output.stdout);
    }


    //then make them all 755, owned by splunk
    for (let addon of addons) {
        //copy the file
        output = await callAnsibleFunction(`ansible ${host.ansibleName} -i inventory.yaml -b --vault-password-file .pass ` +
            `-m file -a "mode=0755 owner=splunk group=splunk recurse=true ` +
            `path=${host.splunkHomePath + '/' + addon.addonFolderName} "`);
        logDebug(output.stdout);
    }



}












export const deployAddonsToHost2 = async (host: Host, addons: AddOn[]) => {
    let commandPrefix = `ansible ${host.ansibleName} -i inventory.yaml --vault-password-file .pass `;

    //create the wd folder in /opt
    let output = await callAnsibleFunction(`${commandPrefix} -b -m file -a "path=${REMOTE_BASE_APP_COMPRESSED_DIRECTORY} state=directory"`);
    logDebug(output.stdout);
    output = await callAnsibleFunction(`${commandPrefix} -b -m file -a "path=${REMOTE_TEMP_EXTRACT_FOLDER} state=directory"`);
    logDebug(output.stdout);

    //for each addon, deploy it
    for (let addon of addons) {
        //copy the file
        output = await callAnsibleFunction(`ansible ${host.ansibleName} -i inventory.yaml -b --vault-password-file .pass ` +
            `-m copy -a "src='${BASE_DIRECTORY + ANSIBLE_ADDONS_DIRECTORY}/${addon.addonFileLocation}' ` +
            `dest=${REMOTE_BASE_APP_COMPRESSED_DIRECTORY}"`);
        logDebug(output.stdout);
    }


    //once we have deployed all the addons, we need to extract them
    //i do this down here cause I don't love the idea of having it copy, extract, copy, extract
    for (let addon of addons) {
        //copy the file
        output = await callAnsibleFunction(`ansible ${host.ansibleName} -i inventory.yaml -b --vault-password-file .pass ` +
            `-m unarchive -a "remote_src=true src='${REMOTE_BASE_APP_COMPRESSED_DIRECTORY}/${addon.addonFileLocation}' ` +
            `dest=${REMOTE_TEMP_EXTRACT_FOLDER}"`);
        logDebug(output.stdout);
    }

    //once we have deployed all the addons, we need to extract them
    //i do this down here cause I don't love the idea of having it copy, extract, copy, extract
    for (let addon of addons) {
        //copy the file
        output = await callAnsibleFunction(`ansible ${host.ansibleName} -i inventory.yaml -b --vault-password-file .pass ` +
            `-m unarchive -a "remote_src=true src='${REMOTE_BASE_APP_COMPRESSED_DIRECTORY}/${addon.addonFileLocation}' ` +
            `dest=${REMOTE_TEMP_EXTRACT_FOLDER}"`);
        logDebug(output.stdout);

        let allRemovalFiles: string[] = addon.addonIgnoreFileOption?.split(',');
        if (allRemovalFiles !== null && allRemovalFiles.length > 0 && allRemovalFiles[0] !== '') {
            for (let p of allRemovalFiles) {
                //if it has any special directory paths
                if (p.indexOf('..') > -1 || p.indexOf('~') > -1 || p.indexOf('!') > -1) {
                    continue;
                }
                //delete the files
                output = await callAnsibleFunction(`ansible ${host.ansibleName} -i inventory.yaml -b --vault-password-file .pass ` +
                    `-m shell -a "rm -rf '${path.join(REMOTE_TEMP_EXTRACT_FOLDER, addon.addonFolderName, p)}'"`);

            }
        }
    }

    //once we have deployed all the addons, we need to extract them
    //i do this down here cause I don't love the idea of having it copy, extract, copy, extract
    for (let addon of addons) {
        //copy the file
        output = await callAnsibleFunction(`ansible ${host.ansibleName} -i inventory.yaml -b --vault-password-file .pass ` +
            `-m copy -a "remote_src=true src='${path.join(REMOTE_TEMP_EXTRACT_FOLDER, addon.addonFolderName)}' ` +
            `dest=${host.splunkHomePath}"`);
        logDebug(output.stdout);
    }


    //then make them all 755, owned by splunk
    for (let addon of addons) {
        //copy the file
        output = await callAnsibleFunction(`ansible ${host.ansibleName} -i inventory.yaml -b --vault-password-file .pass ` +
            `-m file -a "mode=0755 owner=splunk group=splunk recurse=true ` +
            `path=${host.splunkHomePath + '/' + addon.addonFolderName} "`);
        logDebug(output.stdout);
    }



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