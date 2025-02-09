import type { PageServerLoad } from './$types';
import type { Host } from "$lib/types.ts"
import * as scdf from "$lib/databaseFunctions/serverClassDatabaseFunctions"
import * as df from '$lib/databaseFunctions/hostDatabaseFunctions.js' //example of importing a bunch of functions
import { isNullOrUndefined } from '$lib/utils';
import { getHosts, insertHost } from '$lib/server/db/models/hosts';
import { getServerClasses, getServerClassByHosts } from '$lib/server/db/models/serverClass';

export const load: PageServerLoad = async ({ locals }) => {
    //GET HOST INFORMATION
    let rowInformation = await getHosts();
    let rows = rowInformation.rows as Host[];
    let rowCount = rowInformation.totalRows;

    //get all of the server classes 
    let allServerClassesInfo = await getServerClasses();
    let allServerClasses = allServerClassesInfo.rows;

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


    return {
        hosts: rows,
        hostCount: rowCount,
        allPossibleServerClasses: allServerClasses
    };
};

