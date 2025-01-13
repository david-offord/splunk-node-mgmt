import { fail, json } from '@sveltejs/kit';
import type { AddOn, ServerClasses, ServerClassJoinAddon, AddonValidationObject } from "$lib/types.ts"
import type { RequestHandler } from './$types';
import { FileSaveResults } from "$lib/enums"

import * as aodf from "$lib/databaseFunctions/addonDatabaseFunctions"
import * as aoff from "$lib/workingDirectoryFunctions/addOnFileFunctions"
import { isNullOrUndefined } from '$lib/utils';


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
    let formdata: any = await request.formData();
    let newAddon: any = formdata;
    let validationObj: AddonValidationObject = {};
    let error = false;
    let fileUploadedName = '';//set if the file is okay to save

    //check if its even a valid add-on
    let verifyAddOn = await aoff.verifyAddOn(newAddon);

    //if it didnt fail lol
    if (verifyAddOn.success === true) {
        //save the file
        let result = await aoff.checkIfAddonCanBeSaved(newAddon);

        //save name for later
        fileUploadedName = newAddon.get('file')?.name;

        if (result === FileSaveResults.FailedFileAlreadyExisted) {
            validationObj.addOnFileError = 'Addon with same file name already exists.';
            error = true;
        }
        else if (fileUploadedName === null) {
            validationObj.addOnFileError = 'File is required for new add-on.';
            error = true;
        }
    }
    else {
        validationObj.addOnFileError = 'File must only contain one folder.';
        error = true;
    }



    //get the other values from this thing
    newAddon = Object.fromEntries(newAddon.entries()) as AddOn;
    newAddon.serverClassesAssigned = JSON.parse(newAddon.serverClassesAssigned);

    //do error checking
    let addonPayload: AddOn = newAddon as AddOn;

    if (addonPayload.displayName === '' || addonPayload.displayName === null) {
        validationObj.addonName = 'Name is required.';
        error = true;
    }

    if (addonPayload.actionOnInstallation === '' || addonPayload.actionOnInstallation === null) {
        validationObj.actionOnInstallation = 'Action on installation is required.';
        error = true;
    }

    //if there are errors, return them
    if (error) {
        return json(validationObj, {
            status: 500
        });
    }

    //actyally save the file
    let result = await aoff.saveAddonFromFormData(formdata);

    //see if we need to update the name
    if (fileUploadedName !== null) {
        addonPayload.addonFileLocation = fileUploadedName;
    }
    if (verifyAddOn.extractedFolderName !== null) {
        addonPayload.addonFolderName = verifyAddOn.extractedFolderName;
    }

    //save to db
    let newId = await aodf.addUpdateAddon(addonPayload);
    return json(newId);
}

//for updating addon
export const PATCH: RequestHandler = async function PATH({ request }) {
    let newAddon: any = await request.formData();
    let validationObj: AddonValidationObject = {};
    let error = false;

    let existingAddonDefinition = await aodf.getSingleAddon(newAddon.get('id'));

    //if no addon already exists, return a 500
    if (existingAddonDefinition === null) {
        return json({ error: 'Error occurred finding add-on with ID ' + newAddon.get('id') + '.' }, {
            status: 500
        });
    }

    //save the file
    let result = await aoff.saveAddonFromFormData(newAddon, null, existingAddonDefinition.addonFileLocation);

    if (result === FileSaveResults.FailedFileAlreadyExisted) {
        validationObj.addOnFileError = 'Addon with same file name already exists.';
        error = true;
    }

    //save name for later
    let fileUploadedName = newAddon.get('file')?.name;

    //get the other values from this thing
    newAddon = Object.fromEntries(newAddon.entries()) as AddOn;
    newAddon.serverClassesAssigned = JSON.parse(newAddon.serverClassesAssigned);

    //do error checking
    let addonPayload: AddOn = newAddon as AddOn;

    if (addonPayload.displayName === '' || addonPayload.displayName === null) {
        validationObj.addonName = 'Name is required.';
        error = true;
    }

    if (addonPayload.actionOnInstallation === '' || addonPayload.actionOnInstallation === null) {
        validationObj.actionOnInstallation = 'Action on installation is required.';
        error = true;
    }

    //if there are errors, return them
    if (error) {
        return json(validationObj, {
            status: 500
        });
    }

    //see if we need to update the name
    if (isNullOrUndefined(fileUploadedName) === false) {
        addonPayload.addonFileLocation = fileUploadedName;
    } else {
        addonPayload.addonFileLocation = existingAddonDefinition.addonFileLocation;
    }


    //TODO: UPDATE THIS WITH CODE ABOVE

    let newId = await aodf.addUpdateAddon(addonPayload);
    return json(newId);
}

//deleting addon
export const DELETE: RequestHandler = async function DELETE({ request }) {
    let addon: AddOn = await request.json();

    //delete the db entry
    let currAddonDefinition = await aodf.getSingleAddon(addon.id);
    await aodf.deleteSingleAddon(addon.id);

    //delete the file
    await aoff.deleteAddon(currAddonDefinition);
    return json(true);
}
