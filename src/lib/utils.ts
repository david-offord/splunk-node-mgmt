import { exec } from 'child_process';
import { addJobLog } from './server/db/models/jobs';
import { LogLevel } from './enums';

export function isNullOrUndefined(value: any): boolean {
    return value === null || value === undefined;
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
