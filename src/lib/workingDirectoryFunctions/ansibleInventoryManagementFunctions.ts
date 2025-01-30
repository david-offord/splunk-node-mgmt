import type { AnsibleVariableFile, Host } from "$lib/types.ts"
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { parse, stringify } from 'yaml'

const ANSIBLE_BASE_DIRECTORY: string = "workingdirectory/ansible/"
const ANSIBLE_PASS_FILE_LOCATION: string = path.join(ANSIBLE_BASE_DIRECTORY, ".pass");
const ANSIBLE_GROUP_VARS_LOCATION: string = path.join(ANSIBLE_BASE_DIRECTORY, "group_vars/");
const ANSIBLE_INVENTORY_FILE: string = path.join(ANSIBLE_BASE_DIRECTORY, "inventory.yaml");

//***************************************
//BEGIN PUBLIC FACING FUNCTIONS
//***************************************

//gets a list of every host
export const addUpdateHostInventory = async (oldHost: Host, newHost: Host) => {
    //read the existing ini file
    let text = fs.readFileSync(ANSIBLE_INVENTORY_FILE).toString();
    const config = parse(text);

    let stanzaName: string = null;

    if (oldHost !== null)
        stanzaName = oldHost.ansibleName;

    let newStanzaName = newHost.ansibleName;

    //check if there is no existing stanza
    if (stanzaName !== null && config[stanzaName]) {
        //if there isnt, then make a blank one
        delete config[stanzaName];
    }

    //build the yaml host dictionary
    config[newStanzaName] = {};
    config[newStanzaName].hosts = {};
    config[newStanzaName].hosts[newHost.hostname] = {
        ansible_host: newHost.ipAddress
    };
    //save all the variables we may use later
    config[newStanzaName].vars = {
        "customer_code": newHost.customerCode,
        "host_id": newHost.id,
        "splunk_home_path": newHost.splunkHomePath,
    }

    //now start doing logic for ansible password storing

    //config[newStanzaName][newHost.hostname + ' ansible_host='] = newHost.hostname;
    // config[newStanzaName].ansible_hostname = newHost.hostname;
    // config[newStanzaName].customer_code = newHost.customerCode;
    // config[newStanzaName].host_id = newHost.id;
    // config[newStanzaName].ansible_user = '{{' + newHost.customerCode + '_' + newHost.hostname + '_ssh_username}}'
    // config[newStanzaName].ansible_password = '"{{' + newHost.customerCode + '_' + newHost.hostname + '_ssh_password}}"';
    // config[newStanzaName].ansible_become_password = '"{{' + newHost.customerCode + '_' + newHost.hostname + '_ssh_password}}"';
    // config[newStanzaName].ansible_splunk_password = '{{' + newHost.customerCode + '_' + newHost.hostname + '_splunk_password}}';

    //print it out to the file
    fs.writeFileSync(ANSIBLE_INVENTORY_FILE, stringify(config));

    //save the secrets file
    saveSecrets(oldHost, newHost);
};

export const deleteHostFromInventory = async (host: Host) => {
    //read the existing ini file
    let text = fs.readFileSync(ANSIBLE_INVENTORY_FILE).toString();
    const config = parse(text);

    let stanzaName = host.ansibleName;

    //check if there is no existing stanza
    if (config[stanzaName]) {
        //if there isnt, then make a blank one
        delete config[stanzaName];
    }

    //print it out to the file
    fs.writeFileSync(ANSIBLE_INVENTORY_FILE, stringify(config));
};

export const getSplunkAdminPassword = async (host: Host) => {
    let existingContents = loadVaultContents(host.ansibleName);
    let ansibleVaultObj: AnsibleVariableFile = parse(existingContents);
    return ansibleVaultObj.ansible_splunk_password;
}


//***************************************
//BEGIN PRIVATE FUNCTIONS
//***************************************
function saveSecrets(oldHost: Host, newHost: Host) {
    //check if there is already a password file for the old host definition
    if (oldHost !== null && fs.existsSync(path.join(ANSIBLE_GROUP_VARS_LOCATION, oldHost.ansibleName + '.yaml'))) {
        saveSecretsExisting(oldHost, newHost);
    }
    else {
        saveSecretsNew(newHost);
        loadVaultContents(newHost.ansibleName);
    }
}

function saveSecretsNew(host: Host) {
    //build the variable file
    let ansibleVaultObj: AnsibleVariableFile = {
        'ansible_user': host.linuxUsername,
        'ansible_password': host.linuxPassword,
        'ansible_become_password': host.linuxPassword,
        'ansible_splunk_password': host.splunkPassword,
    };
    //save it to the vault
    saveVaultContents(host.ansibleName, ansibleVaultObj);
}

function saveSecretsExisting(oldHost: Host, host: Host) {
    //get current contents
    let existingContents = loadVaultContents(oldHost.ansibleName);

    //parse to object
    let ansibleVaultObj: AnsibleVariableFile = parse(existingContents);

    //check if the inputs from the front end are empty - if they are, dont replace them
    if (host.linuxPassword) {
        ansibleVaultObj['ansible_password'] = host.linuxPassword;
        ansibleVaultObj['ansible_become_password'] = host.linuxPassword;
    }
    if (host.splunkPassword) {
        ansibleVaultObj['ansible_splunk_password'] = host.splunkPassword;
    }
    //delete the old file
    deleteVaultFile(oldHost.ansibleName);

    //save back to a file
    saveVaultContents(host.ansibleName, ansibleVaultObj);
}

function saveVaultContents(ansibleName: string, variableFile: AnsibleVariableFile) {
    let file = path.join(ANSIBLE_GROUP_VARS_LOCATION, ansibleName + '.yaml');
    fs.writeFileSync(file, stringify(variableFile));

    let code = child_process.execSync(`ansible-vault encrypt ${file} --vault-password-file ${ANSIBLE_PASS_FILE_LOCATION}`)
    console.log(code.toString());
}

function deleteVaultFile(ansibleName: string) {
    let file = path.join(ANSIBLE_GROUP_VARS_LOCATION, ansibleName + '.yaml');
    fs.unlinkSync(file);
}

function loadVaultContents(ansibleName: string) {
    let file = path.join(ANSIBLE_GROUP_VARS_LOCATION, ansibleName + '.yaml');
    let existingConfig = child_process.execSync(`ansible-vault view ${file} --vault-password-file ${ANSIBLE_PASS_FILE_LOCATION}`)
    return existingConfig.toString();
}