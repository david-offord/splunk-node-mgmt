import { exec } from 'child_process';

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

export const logDebug = async (message: string) => {
    if (isNullOrUndefined(message) || message === "")
        return;

    console.log(message);
}

export const logError = async (message: string) => {
    if (isNullOrUndefined(message) || message === "")
        return;

    console.error(message);
}