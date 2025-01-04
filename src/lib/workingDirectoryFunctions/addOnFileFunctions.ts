import * as fs from 'fs';
import * as path from 'path';
import { FileSaveResults } from "$lib/enums"

const ADD_ON_STORAGE_DIRECTORY: string = "workingdirectory/addons/"

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

/**
 * Attempts to untar a file on local disk.
 * 
 * @param {String} fileName - Name of tar file within the addons folder.
 * @returns 
 */
export const untarAddOn = async (fileName: string = null) => {
    let folderName = '';
    try {

    }
    catch (ex: any) {
        console.error(ex);
    }
    return folderName;
};