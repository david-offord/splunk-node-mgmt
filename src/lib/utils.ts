import { exec } from 'child_process';
import { addJobLog } from './server/db/models/jobs';
import { AddonDeploymentPermissions, AddOnManagementPermissions, HostManagementPermissions, JobViewPermissions, LogLevel, PlaybookManagementPermissions, PlaybookRunPermissions, ServerClassManagementPermissions, UserManagementPermissions } from './enums';
import * as crypto from 'crypto';
import type { UserWithPermissions } from './types';

export function isNullOrUndefined(value: any): boolean {
    return value === null || value === undefined;
}

export function canUserAccessView(userPermissions: UserWithPermissions, url: string) {
    if (url.indexOf('login') !== -1) {
        return true;
    }

    if (userPermissions === null || typeof userPermissions === "undefined") {
        return false;
    }

    //host management page
    if (url === "/" && userPermissions.hostManagement === HostManagementPermissions.None) {
        return false;
    }
    //the addon page
    if (url.indexOf('addons') !== -1 && userPermissions.addonManagement === AddOnManagementPermissions.None) {
        return false;
    }
    if (url.indexOf('serverclass') !== -1 && userPermissions.serverClassManagement === ServerClassManagementPermissions.None) {
        return false;
    }
    if (url.indexOf('playbooks') !== -1 && userPermissions.playbookManagement === PlaybookManagementPermissions.None) {
        return false;
    }
    if (url.indexOf('playbooks') !== -1 && url.indexOf('run') !== -1 && userPermissions.playbookRunning === PlaybookRunPermissions.None) {
        return false;
    }
    if (url.indexOf('users') !== -1 && userPermissions.userManagement === UserManagementPermissions.None) {
        return false;
    }
    if (url.indexOf('job') !== -1 && userPermissions.jobViewing === JobViewPermissions.None) {
        return false;
    }

    return true;
}

export function canUserAccessApi(userPermissions: UserWithPermissions, url: string, method: string) {
    //if its a get, just treat it like a view lol
    if (method === "GET") {
        return canUserAccessView(userPermissions, url);
    }


    if (url.indexOf('login') !== -1) {
        return true;
    }

    if (userPermissions === null || typeof userPermissions === "undefined") {
        return false;
    }

    //host management edits
    if (url === "/" && userPermissions.hostManagement === HostManagementPermissions.CanEdit) {
        return true;
    }
    //the addon edits
    if (url.indexOf('addons') !== -1 && userPermissions.addonManagement === AddOnManagementPermissions.CanEdit) {
        return true;
    }
    //server class edits
    if (url.indexOf('serverclass') !== -1 && userPermissions.serverClassManagement === ServerClassManagementPermissions.CanEdit) {
        return true;
    }
    //playbook edits
    if (url.indexOf('playbooks') !== -1 && userPermissions.playbookManagement === PlaybookManagementPermissions.CanEdit) {
        return true;
    }
    //playbook runs
    if (url.indexOf('playbooks') !== -1 && url.indexOf('run') !== -1 && userPermissions.playbookRunning === PlaybookRunPermissions.CanRun) {
        return true;
    }
    //deploying addons
    if (url.indexOf('deployaddons') !== -1 && userPermissions.addonDeployments === AddonDeploymentPermissions.CanRun) {
        return true;
    }
    //users edit
    if (url.indexOf('users') !== -1 && userPermissions.userManagement === UserManagementPermissions.CanEdit) {
        return true;
    }

    return false;
}


export const callCliFunction = async (command: string, cwd: string) => {
    let out = "";
    let err = "";
    let ansiblePromise = new Promise<string>((resolve, reject) => {
        exec(command, {
            cwd: cwd
        }, (error, stdout, stderr) => {
            if (error) {
                err = `exec error: ${error}`;
                return;
            }
            out = stdout;
            err = stderr;
            resolve(stdout);
        });
    });
    await ansiblePromise;

    return { stdout: out, stderr: err };
}

export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export const logDebug = async (message: string, logJobId: number = null) => {
    //if there is a job in the DB for this, update the logs
    if (logJobId !== null) {
        await addJobLog(logJobId, message, LogLevel.Debug);
    }
    const timestamp = new Date().toISOString();
    if (isNullOrUndefined(message) || message === "")
        return;

    message = timestamp + ": " + message;
    console.log(message);

}


export const logInfo = async (message: string, logJobId: number = null) => {
    //if there is a job in the DB for this, update the logs
    if (logJobId !== null) {
        await addJobLog(logJobId, message, LogLevel.Info);
    }

    const timestamp = new Date().toISOString();
    if (isNullOrUndefined(message) || message === "")
        return;

    message = timestamp + ": " + message;
    console.log(message);
}

export const logError = async (message: string, logJobId: number = null) => {
    //if there is a job in the DB for this, update the logs
    if (logJobId !== null) {
        await addJobLog(logJobId, message, LogLevel.Error);
    }
    const timestamp = new Date().toISOString();
    if (isNullOrUndefined(message) || message === "")
        return;

    message = timestamp + ": " + message;
    console.error(message);

}

export const parseAnsibleOutput = (output: string) => {
    //get pipe location
    let pipeLocation = output.indexOf('|');
    let arrowLoc = output.indexOf('=>');
    //get the host, status, and message based on that
    let parsedObj: any = {};

    parsedObj['host'] = output.substring(0, pipeLocation).trim();
    parsedObj['status'] = output.substring(pipeLocation + 1, arrowLoc).trim();
    let message = output.substring(arrowLoc + 2).trim();

    parsedObj['ok'] = true;

    try {
        parsedObj['message'] = JSON.parse(message);
    }
    catch (ex) {
        parsedObj['message'] = message;
        parsedObj['errorParsing'] = true;
    }

    //save the ok down here if there was an error
    if (parsedObj['status'].toLocaleLowerCase() === 'unreachable!')
        parsedObj['ok'] = false;

    return parsedObj;
}

export const hashPassword = (unhashedPassword: string) => {
    let hashedPassword = crypto.hash('sha256', unhashedPassword);
    return hashedPassword;
}
