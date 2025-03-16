import { fail, json } from '@sveltejs/kit';
import type { Host, ServerClasses } from "$lib/types.ts"
import type { RequestHandler } from './$types';
import { canUserAccessApi, isNullOrUndefined } from '$lib/utils';
import { getServerClassPageLoadData } from './serverClassFunctions';
import { deleteServerClass, insertNewServerClass, updateServerClassAddons, updateServerClassHosts } from '$lib/server/db/models/serverClass';

//for updating/adding server classes
export const GET: RequestHandler = async function GET({ locals, url, request }) {
    let canAccess = canUserAccessApi(locals.userPermissions, url.pathname, request.method);
    if (!canAccess) {
        return json({ error: "You do not have permission to access this API" }, { status: 403 });
    }

    let returnObject = await getServerClassPageLoadData(false)
    return json(returnObject.serverClasses);
}

//create new server class
export const POST: RequestHandler = async function POST({ locals, url, request }) {
    let canAccess = canUserAccessApi(locals.userPermissions, url.pathname, request.method);
    if (!canAccess) {
        return json({ error: "You do not have permission to access this API" }, { status: 403 });
    }

    let newsc = await request.json();

    //send the new name
    let newId = await insertNewServerClass(newsc as string);

    return json(newId);
}

//for updating serverclass
export const PATCH: RequestHandler = async function PATH({ locals, url, request }) {
    let canAccess = canUserAccessApi(locals.userPermissions, url.pathname, request.method);
    if (!canAccess) {
        return json({ error: "You do not have permission to access this API" }, { status: 403 });
    }

    //get the serverclass and other info from the request
    let apiData = await request.json() as ServerClasses;

    //save a variable for the return later
    try {
        //call the update function
        if (isNullOrUndefined(apiData.hostsAssigned) === false) {
            await updateServerClassHosts(apiData.id, apiData.hostsAssigned);
        }
        if (isNullOrUndefined(apiData.addonsAssigned) === false) {
            await updateServerClassAddons(apiData.id, apiData.addonsAssigned);
        }

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

//deleting server class
export const DELETE: RequestHandler = async function DELETE({ locals, url, request }) {
    let canAccess = canUserAccessApi(locals.userPermissions, url.pathname, request.method);
    if (!canAccess) {
        return json({ error: "You do not have permission to access this API" }, { status: 403 });
    }

    let sc: ServerClasses = await request.json();
    await deleteServerClass(sc.id);
    return json(true);
}

