import { fail, json } from '@sveltejs/kit';
import type { AddOn, Host, ServerClasses, ServerClassJoinAddon } from "$lib/types.ts"
import type { RequestHandler } from './$types';
import * as fs from 'fs';
import * as scdf from '$lib/databaseFunctions/serverClassDatabaseFunctions';
import * as aodf from "$lib/databaseFunctions/addonDatabaseFunctions"

//this should probably go in a seperate file lmfao
const ADD_ON_STORAGE_DIRECTORY: string = "workingdirectory/addons/"

//for getting all addons
export const GET: RequestHandler = async function GET({ request }) {
    let addons: Array<AddOn> = await aodf.getAllAddons();
    let serverClassesByAddon: Array<ServerClassJoinAddon> = await aodf.getAddonsByServerClass();

    addons = addons.sort((a, b) => {
        var textA = a.displayName.toUpperCase();
        var textB = b.displayName.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });

    addons.forEach(x => {
        x.appFolderName = x.addonFileLocation;
    });

    //get all the server classes into 1 object
    let allServerClassesByAddons: any = {};
    for (let scba of serverClassesByAddon) {
        if (typeof allServerClassesByAddons[scba.addonId] == 'undefined') {
            allServerClassesByAddons[scba.addonId] = [];
        }
        allServerClassesByAddons[scba.addonId].push(scba.addonId);
    }

    //for each server class, get that information
    for (let ad of addons) {
        if (typeof allServerClassesByAddons[ad.id] == 'undefined') {
            ad.serverClassesAssigned = [];
        }
        else {
            ad.serverClassesAssigned = allServerClassesByAddons[ad.id];
        }
    }

    return json(addons);

}

//create new server class
export const POST: RequestHandler = async function POST({ request }) {
    let newAddon: any = await request.formData();


    //TODO: NEXT, WE NEED TO VALIDATE IF THE FILE ALREADY EXISTED, AND THAT ITS A TAR.GZ WHICH CAN PROBABLY BE DONE ON THE FRONT END
    //save the file
    let fileUploaded: File = newAddon.get('file');
    //fileUploaded.
    fs.writeFileSync(ADD_ON_STORAGE_DIRECTORY + '/' + fileUploaded.name, Buffer.from(await fileUploaded.arrayBuffer()), function (err: Error) {
        console.log(err);
    });

    newAddon = Object.fromEntries(newAddon.entries());
    newAddon.serverClassesAssigned = JSON.parse(newAddon.serverClassesAssigned);

    //let newId = await aodf.addUpdateAddon(newAddon);
    //return json(newId);
    return json(0);
}

//for updating addon
export const PATCH: RequestHandler = async function PATH({ request }) {
    //try to update it
    try {
        let newAddon = await request.json();

        await aodf.addUpdateAddon(newAddon);
    }
    //if something goes, wrong, maybe dont crash the entire application
    catch (ex) {
        return json(false, {
            status: 500
        });
    }

    //return 200 saying it worked
    return json(true);
}

//deleting addon
export const DELETE: RequestHandler = async function DELETE({ request }) {
    let sc: ServerClasses = await request.json();
    await scdf.deleteServerClass(sc);
    return json(true);
}
