import type { PageServerLoad } from './$types';
import type { Host } from "$lib/types.ts"
import * as scdf from "$lib/databaseFunctions/serverClassDatabaseFunctions"
import * as adf from "$lib/databaseFunctions/addonDatabaseFunctions"
import * as df from '$lib/databaseFunctions/hostDatabaseFunctions.js' //example of importing a bunch of functions

export const load: PageServerLoad = async ({ locals }) => {
    let serverClasses = await scdf.getAllServerClasses();

    //reference of hosts, just id and names though
    let hosts = await df.getAllHostsOnlyNamesAndIds();
    hosts = hosts.sort((a, b) => {
        var textA = a.hostname.toUpperCase();
        var textB = b.hostname.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    })

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


    let addons = await adf.getAllAddons();
    addons = addons.sort((a, b) => {
        var textA = a.displayName.toUpperCase();
        var textB = b.displayName.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    })

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

    return {
        serverClasses: serverClasses,
        addons: addons,
        hosts: hosts
    }
};

