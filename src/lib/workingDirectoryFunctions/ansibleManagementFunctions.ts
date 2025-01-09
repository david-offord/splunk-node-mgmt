import type { AddOn, AnsibleVariableFile, Host } from "$lib/types.ts"
import { exec } from 'child_process';

const BASE_DIRECTORY = '/home/dave/git_projects/splunk-node-mgmt';
const ANSIBLE_WORKING_DIRECTORY = '/workingdirectory/ansible';
const ANSIBLE_ADDONS_DIRECTORY = '/workingdirectory/addons';

export const deployAddonsToHost = async (host: Host, addons: AddOn[]) => {

    //example "pong"
    let insertPromise = new Promise<string>((resolve, reject) => {
        exec(`ansible -m ping ${host.ansibleName} -i inventory.yaml --vault-password-file .pass`, {
            cwd: BASE_DIRECTORY + ANSIBLE_WORKING_DIRECTORY
        }, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            resolve(stdout);
        });
    });

    let output = await insertPromise;

    let out = "";
    let err = "";
    insertPromise = new Promise<string>((resolve, reject) => {
        exec(`ansible ${host.ansibleName} -i inventory.yaml --vault-password-file .pass -m copy -a "src='${BASE_DIRECTORY + ANSIBLE_ADDONS_DIRECTORY}/${addons[0].addonFileLocation}' dest=/tmp"`, {
            cwd: BASE_DIRECTORY + ANSIBLE_WORKING_DIRECTORY
        }, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            out = stdout;
            err = stderr;
            resolve(stdout);
        });
    });

    output = await insertPromise;
}