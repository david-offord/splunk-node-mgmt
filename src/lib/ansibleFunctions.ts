import type { Host } from "$lib/types.ts"
import * as fs from 'fs';
import * as path from 'path';

const ANSIBLE_BASE_DIRECTORY: string = "workingdirectory/ansible/"


//BEGIN PUBLIC FACING FUNCTIONS

//gets a list of every host
export const addUpdateHostInventory = async (oldHost: Host, newHost: Host) => {
    let toInventoryFile: string = '';

    toInventoryFile += JSON.stringify(oldHost);
    toInventoryFile += JSON.stringify(newHost);

    fs.writeFileSync(path.join(ANSIBLE_BASE_DIRECTORY, "inventory.ini"), toInventoryFile);
};


