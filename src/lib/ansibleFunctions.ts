import type { Host } from "$lib/types.ts"
import * as fs from 'fs';
import * as path from 'path';
import { stringify, parse } from 'ini'

const ANSIBLE_BASE_DIRECTORY: string = "workingdirectory/ansible/"
const ANSIBLE_INVENTORY_FILE: string = path.join(ANSIBLE_BASE_DIRECTORY, "inventory.ini");

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

    config[newStanzaName] = {};
    config[newStanzaName].ansible_hostname = newHost.hostname;
    config[newStanzaName].customer_code = newHost.customerCode;
    config[newStanzaName].host_id = newHost.id;

    //print it out to the file
    fs.writeFileSync(ANSIBLE_INVENTORY_FILE, stringify(config));
};

export const deleteHostFromInventory = async (host: Host) => {
    //read the existing ini file
    let text = fs.readFileSync(ANSIBLE_INVENTORY_FILE).toString();
    const config = parse(text);

    let stanzaName = host.customerCode + '_' + host.hostname;

    //check if there is no existing stanza
    if (config[stanzaName]) {
        //if there isnt, then make a blank one
        delete config[stanzaName];
    }

    //print it out to the file
    fs.writeFileSync(ANSIBLE_INVENTORY_FILE, stringify(config));
};
