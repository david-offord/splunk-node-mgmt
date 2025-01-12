import type { AddOn, AnsibleVariableFile, Host } from "$lib/types.ts"
import { isNullOrUndefined } from "$lib/utils";
import { exec } from 'child_process';
import { stderr } from "process";

const BASE_DIRECTORY = '/home/dave/git_projects/splunk-node-mgmt';
const ANSIBLE_WORKING_DIRECTORY = '/workingdirectory/ansible';
const ANSIBLE_ADDONS_DIRECTORY = '/workingdirectory/addons';

const REMOTE_BASE_DIRECTORY = '/tmp/snm_tmp_';

export const deployAddonsToHost = async (host: Host, addons: AddOn[]) => {

    let timestampWorkingDirectory = new Date().getTime();
    let commandPrefix = `ansible ${host.ansibleName} -i inventory.yaml --vault-password-file .pass `;

    //example "pong"
    let output = await callAnsibleFunction(`${commandPrefix} -m ping `);
    console.log(output.stdout);

    //create the wd folder in /tmp
    output = await callAnsibleFunction(`${commandPrefix} -m file -a "path=${REMOTE_BASE_DIRECTORY + timestampWorkingDirectory} state=directory"`);
    console.log(output.stdout);


    //copy the file
    output = await callAnsibleFunction(`ansible ${host.ansibleName} -i inventory.yaml --vault-password-file .pass ` +
        `-m copy -a "src='${BASE_DIRECTORY + ANSIBLE_ADDONS_DIRECTORY}/${addons[0].addonFileLocation}' ` +
        `dest=${REMOTE_BASE_DIRECTORY + timestampWorkingDirectory}"`);
    console.log(output.stdout);
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