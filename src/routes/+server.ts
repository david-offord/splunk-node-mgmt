import { fail, json } from '@sveltejs/kit';
import type { Host, ValidationObject } from "$lib/types.ts"
import type { RequestHandler } from './$types';
import * as df from '$lib/databaseFunctions.js' //example of importing a bunch of functions
import * as af from '$lib/ansibleFunctions.js' //example of importing a bunch of functions
import * as isIp from 'is-ip';
import * as net from 'net';

//for updating/adding host
export const GET: RequestHandler = async function GET({ request }) {
    return json(await df.getAllHosts());
}

//for updating/adding host
export const POST: RequestHandler = async function POST({ request }) {
    //get the host from the request
    let host: Host = await request.json();

    //verify the host sent in has required fields formatted correctly
    let error = false;
    let errorPayload: ValidationObject = {};
    if (host.customerCode.length !== 5) {
        error = true;
        errorPayload['customerCode'] = "Customer code must be 5 characters."
    }
    if (isIp.isIP(host.ipAddress) === false) {
        error = true;
        errorPayload.ipAddress = "IP is not valid."
    }

    //test connectivity
    if (await checkConnection(host.ipAddress, 8089) === false) {
        error = true;
        errorPayload.generalError = "Can't connect to host."
    }

    //if an validation error was found, return 500 with errors
    if (error) {
        return json(errorPayload, {
            status: 500
        });
    }

    //get the old host from the db
    let oldHost = await df.getSingleHost(host.id);

    //update/add the host
    let results = await df.addUpdateHost(host);

    //get updated host
    let newHost = await df.getSingleHost(results);

    //if the database thing succeeded
    if (results !== -1) {
        await af.addUpdateHostInventory(oldHost, newHost);
    }

    return json(host);
}


//for updating/adding host
export const DELETE: RequestHandler = async function DELETE({ request }) {
    //get the host from the request
    let host: Host = await request.json();

    //get the old host from the db
    let oldHost = await df.getSingleHost(host.id);

    //delete from the db
    await df.deleteSingleHost(host.id);

    return json(host);
}



// ****************************************
// BEGIN PRIVATE FUNCTIONS
// ****************************************
function checkConnection(host: string, port: number, timeout: number = null) {
    return new Promise(function (resolve, reject) {
        timeout = timeout || 5000;     // default of 10 seconds
        let socket: net.Socket, timer;
        timer = setTimeout(function () {
            resolve(false);
            socket.end();
        }, timeout);

        socket = net.createConnection(port, host, function () {
            clearTimeout(timer);
            resolve(true);
            socket.end();
        });
        socket.on('error', function (err) {
            clearTimeout(timer);
            resolve(false);
        });
    });
}
