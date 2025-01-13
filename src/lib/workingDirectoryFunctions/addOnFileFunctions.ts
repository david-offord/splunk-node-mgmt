import * as fs from 'fs';
import * as path from 'path';
import { FileSaveResults } from "$lib/enums"
import * as utils from '$lib/utils' // Added import for utils library
import type { AddOn } from '$lib/types';

const ADD_ON_STORAGE_DIRECTORY: string = "workingdirectory/addons/"
const TEMP_DIRECTORY: string = 'workingdirectory/temp'

/**
 * Saves an add-on to the disk. Won't overwrite if the file already exists, and overwriteIfFound is not true.
 * 
 * @param {FormData} formdata - Formdata from front end.
 * @param {string} fileName - Override file name. If not specified, defaults to file name provided.
 * @param {boolean} overwriteIfFound - Overwrite the file if its found. Defaults to false.
 * @returns 
 */
export const saveAddonFromFormData = async (formdata: FormData, fileName: string = null, overwriteIfFoundWithFileName: string = null) => {
    try {
        let fileUploaded: File = formdata.get('file') as File;
        let fileAlreadyExists = false;

        if (fileUploaded === null) {
            return FileSaveResults.Success;
        }

        if (fileName === null) {
            fileName = fileUploaded.name;
        }
        //checks if file is already on file system
        if (fs.existsSync(ADD_ON_STORAGE_DIRECTORY + '/' + fileName)) {
            fileAlreadyExists = true;
        }

        //if they dont want us to overwrite a file, fail out
        if (overwriteIfFoundWithFileName === null && fileAlreadyExists === true)
            return FileSaveResults.FailedFileAlreadyExisted;

        //if they allow us to overwrite a certain file, but the file the specify is not the one we'd overwrite
        if (overwriteIfFoundWithFileName !== fileName && fileAlreadyExists === true)
            return FileSaveResults.FailedFileAlreadyExisted;

        //write it to disk
        fs.writeFileSync(ADD_ON_STORAGE_DIRECTORY + '/' + fileName, Buffer.from(await fileUploaded.arrayBuffer()));

        return fileAlreadyExists ? FileSaveResults.SuccessFileAlreadyExisted : FileSaveResults.Success;
    }
    catch (ex: any) {
        console.error(ex);
        return FileSaveResults.Failed;
    }
};

export const checkIfAddonCanBeSaved = async (formdata: FormData, fileName: string = null, overwriteIfFoundWithFileName: string = null) => {
    try {
        let fileUploaded: File = formdata.get('file') as File;
        let fileAlreadyExists = false;

        if (fileUploaded === null) {
            return FileSaveResults.Success;
        }

        if (fileName === null) {
            fileName = fileUploaded.name;
        }
        //checks if file is already on file system
        if (fs.existsSync(ADD_ON_STORAGE_DIRECTORY + '/' + fileName)) {
            fileAlreadyExists = true;
        }

        //if they dont want us to overwrite a file, fail out
        if (overwriteIfFoundWithFileName === null && fileAlreadyExists === true)
            return FileSaveResults.FailedFileAlreadyExisted;

        //if they allow us to overwrite a certain file, but the file the specify is not the one we'd overwrite
        if (overwriteIfFoundWithFileName !== fileName && fileAlreadyExists === true)
            return FileSaveResults.FailedFileAlreadyExisted;

        //write it to disk
        return fileAlreadyExists ? FileSaveResults.SuccessFileAlreadyExisted : FileSaveResults.Success;
    }
    catch (ex: any) {
        console.error(ex);
        return FileSaveResults.Failed;
    }
};

/**
 * Attempts to untar a file on local disk.
 * 
 * @param {String} fileName - Name of tar file within the addons folder.
 * @returns 
 */
export const verifyAddOn = async (formdata: FormData) => {
    //first of all, grab the file itself
    let fileUploaded: File = formdata.get('file') as File;
    let tempdir = path.join(TEMP_DIRECTORY, 'addons', new Date().getTime().toString());

    let retVal = {
        success: true,
        error: '',
        extractedFolderName: null as string // Changed key from folderName to extractedFolderName
    };

    //no error if there is no addon
    if (fileUploaded === null) {
        return retVal;
    }


    //make some working folders in the temp directory
    fs.mkdirSync(path.join(tempdir, 'extracted'), { recursive: true });

    //write it to disk
    fs.writeFileSync(path.join(tempdir, fileUploaded.name), Buffer.from(await fileUploaded.arrayBuffer()));

    //extract it out
    await utils.callCliFunction(`tar -xvf ${path.join('..', fileUploaded.name)}`, `${path.join(tempdir, 'extracted')}`);

    //check if its a single directory
    let files = fs.readdirSync(path.join(tempdir, 'extracted'));
    if (files.length !== 1 || fs.statSync(path.join(tempdir, 'extracted', files[0])).isDirectory() === false) {
        retVal.error = 'Tar file must contain a single directory.';
        retVal.success = false;
    }
    else {
        retVal.extractedFolderName = files[0]; // Changed key from folderName to extractedFolderName
    }

    //remove the temp directory
    fs.rmSync(tempdir, { recursive: true, force: true });

    //return the results
    return retVal;
};

export const deleteAddon = async (addon: AddOn) => {
    try {
        //remove the temp directory
        fs.rmSync(path.join(ADD_ON_STORAGE_DIRECTORY, addon.addonFileLocation), { recursive: true, force: true });
    }
    catch (ex: any) {
        console.error(ex);
    }
};
