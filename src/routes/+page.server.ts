import type { PageServerLoad } from './$types';
import type { Host } from "$lib/types.ts"
import * as scdf from "$lib/databaseFunctions/serverClassDatabaseFunctions"
import * as df from '$lib/databaseFunctions/hostDatabaseFunctions.js' //example of importing a bunch of functions
import { isNullOrUndefined } from '$lib/utils';
import { getUserByEmail } from '$lib/server/db/models/user';

export const load: PageServerLoad = async ({ locals }) => {

    getUserByEmail('hello');
    // Since `sqlite3` is a callback based system, we'll want to use a 
    // promise to return the data in an async manner.
    let rows = await df.getAllHosts();

    //get all of the server classes 
    let allServerClasses = await scdf.getAllServerClasses();

    //get a list of host -> server classes
    let serverclassesByHost = await df.getServerClassByHosts();

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


    return {
        hosts: rows,
        allPossibleServerClasses: allServerClasses
    };
};

