import { fail, json } from '@sveltejs/kit';
import type { Host, ValidationObject } from "$lib/types.ts"
import type { RequestHandler } from './$types';
import * as af from '$lib/workingDirectoryFunctions/ansibleInventoryManagementFunctions.js' //example of importing a bunch of functions
import * as isIp from 'is-ip';
import * as net from 'net';
import { canUserAccessApi, isNullOrUndefined } from '$lib/utils';
import { addOrUpdateHost, deleteHost, getHosts, getSingleHost } from '$lib/server/db/models/hosts';
import { getServerClassByHosts } from '$lib/server/db/models/serverClass';

//for updating/adding host
export const GET: RequestHandler = async function GET({ locals, request, url }) {
    let canAccess = canUserAccessApi(locals.userPermissions, url.pathname, request.method);
    if (!canAccess) {
        return json({ error: "You do not have permission to access this API" }, { status: 403 });
    }

    //GET HOST INFORMATION
    let rowInformation = await getHosts(url.searchParams.get('search'), parseInt(url.searchParams.get('page')), 10);
    let rows = rowInformation.rows as Host[];
    let rowCount = rowInformation.totalRows;

    let allHostIds = rows.map(x => x.id);

    //get a list of host -> server classes
    let serverclassesByHost = await getServerClassByHosts(allHostIds);

    //build an object of host -> server classes
    let hostsByServerClass: any = {};

    //divide the server classes to their hosts
    for (let serverClassByHost of serverclassesByHost) {
        if (hostsByServerClass[serverClassByHost.id] === undefined) {
            hostsByServerClass[serverClassByHost.id] = [];
        }
        hostsByServerClass[serverClassByHost.id].push(serverClassByHost.serverClassId);
    }

    //for each host, assign the servler class list for it
    for (let host of rows) {
        if (isNullOrUndefined(hostsByServerClass[host.id]))
            host.serverClassesAssigned = [];
        else
            host.serverClassesAssigned = hostsByServerClass[host.id];
    }

    return json({
        hosts: rows,
        hostCount: rowCount,
    });
}

//for updating/adding host
export const POST: RequestHandler = async function POST({ locals, url, request }) {
    let canAccess = canUserAccessApi(locals.userPermissions, url.pathname, request.method);
    if (!canAccess) {
        return json({ error: "You do not have permission to access this API" }, { status: 403 });
    }

    //get the host from the request
    let host: Host = await request.json();

    //verify the host sent in has required fields formatted correctly
    let error = false;
    let errorPayload: ValidationObject = {};
    if ((host.hostname === null || host.hostname === '')) {
        error = true;
        errorPayload.hostname = "Host is required."
    }
    if (host.customerCode.length !== 5) {
        error = true;
        errorPayload['customerCode'] = "Customer code must be 5 characters."
    }
    if (isIp.isIP(host.ipAddress) === false) {
        error = true;
        errorPayload.ipAddress = "IP is not valid."
    }
    if (host.linuxUsername === null || host.linuxUsername === '') {
        error = true;
        errorPayload.linuxUsername = "Username is required."
    }

    //mgmt port validation
    if (isNullOrUndefined(host.splunkManagementPort) || host.splunkManagementPort === '') {
        error = true;
        errorPayload.splunkManagementPort = "Management Port is required."
    }
    else if (isNaN(parseInt(host.splunkManagementPort))) {
        error = true;
        errorPayload.splunkManagementPort = "Management Port must be a number."
    }

    if (isNullOrUndefined(host.splunkRestartCommand) || host.splunkRestartCommand === '') {
        error = true;
        errorPayload.splunkRestartCommand = "Restart command is required."
    }

    //test connectivity
    //if (await checkConnection(host.ipAddress, 8089) === false) {
    //   error = true;
    //   errorPayload.generalError = "Can't connect to host over port 8089."
    //}
    //test connectivity
    if (await checkConnection(host.ipAddress, 22) === false) {
        error = true;
        errorPayload.generalError = "Can't connect to host over port 22."
    }


    //get the old host from the db
    let oldHost = await getSingleHost(host.id);

    //check if the old host existed, and if the password were filled out
    if (oldHost == null && (host.linuxPassword === null || host.linuxPassword === '')) {
        error = true;
        errorPayload.linuxPassword = "Password is required for new hosts."
    }
    if (oldHost == null && (host.splunkPassword === null || host.splunkPassword === '')) {
        error = true;
        errorPayload.splunkPassword = "Password is required for new hosts."
    }

    //if an validation error was found, return 500 with errors
    if (error) {
        return json(errorPayload, {
            status: 500
        });
    }


    //update/add the host
    let results = await addOrUpdateHost(host);

    //get updated host
    let newHost = await getSingleHost(results) as Host;

    //if the database thing succeeded
    if (results !== -1) {
        newHost.linuxPassword = host.linuxPassword;
        newHost.splunkPassword = host.splunkPassword;
        await af.addUpdateHostInventory(oldHost, newHost);
    }

    return json(host);
}


//for updating/adding host
export const DELETE: RequestHandler = async function DELETE({ locals, url, request }) {
    let canAccess = canUserAccessApi(locals.userPermissions, url.pathname, request.method);
    if (!canAccess) {
        return json({ error: "You do not have permission to access this API" }, { status: 403 });
    }

    //get the host from the request
    let host: Host = await request.json();

    //delete from the db
    await deleteHost(host.id);

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

