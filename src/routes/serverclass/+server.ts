import { fail, json } from '@sveltejs/kit';
import type { Host, ServerClasses } from "$lib/types.ts"
import type { RequestHandler } from './$types';
import * as hdf from '$lib/databaseFunctions/hostDatabaseFunctions.js';
import * as scdf from '$lib/databaseFunctions/serverClassDatabaseFunctions';
import { isNullOrUndefined } from '$lib/utils';

//for updating/adding server classes
export const GET: RequestHandler = async function GET({ request }) {
    let serverClasses = await scdf.getAllServerClasses();

    //get a list of all hosts and their server classes
    let serverClassesByHost = await scdf.getAllServerClassesByHosts();

    //basically take all the hosts and sort them by server class id 
    let allServerClassesByHosts: any = {};
    for (let scbh of serverClassesByHost) {
        if (typeof allServerClassesByHosts[scbh.serverClassId] == 'undefined') {
            allServerClassesByHosts[scbh.serverClassId] = [];
        }
        allServerClassesByHosts[scbh.serverClassId].push(scbh);
    }

    //get a list of all hosts and their server classes
    let serverClassesByAddon = await scdf.getAllServerClassesByAddons();

    //basically take all the hosts and sort them by server class id 
    let allServerClassesByAddons: any = {};
    for (let scba of serverClassesByAddon) {
        if (typeof allServerClassesByAddons[scba.serverClassId] == 'undefined') {
            allServerClassesByAddons[scba.serverClassId] = [];
        }
        allServerClassesByAddons[scba.serverClassId].push(scba);
    }


    //for each server class, get that information
    for (let sc of serverClasses) {
        if (typeof allServerClassesByHosts[sc.id] == 'undefined') {
            sc.hostsAssigned = [];
        }
        else {
            sc.hostsAssigned = allServerClassesByHosts[sc.id];
        }

        //do the same for addons
        if (typeof allServerClassesByAddons[sc.id] == 'undefined') {
            sc.addonsAssigned = [];
        }
        else {
            sc.addonsAssigned = allServerClassesByAddons[sc.id];
        }
    }

    return json(serverClasses);

}

//create new server class
export const POST: RequestHandler = async function POST({ request }) {
    let newsc = await request.json();

    let newId = await scdf.createServerClass(newsc);
    return json(newId);
}

//for updating serverclass
export const PATCH: RequestHandler = async function PATH({ request }) {
    //get the serverclass and other info from the request
    let apiData = await request.json() as ServerClasses;

    //save a variable for the return later
    try {
        //call the update function
        if (isNullOrUndefined(apiData.hostsAssigned) === false) {
            await scdf.updateServerClassHosts(apiData);
        }
        if (isNullOrUndefined(apiData.addonsAssigned) === false) {
            await scdf.updateServerClassAddons(apiData);
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
export const DELETE: RequestHandler = async function DELETE({ request }) {
    let sc: ServerClasses = await request.json();
    await scdf.deleteServerClass(sc);
    return json(true);
}
