import type { PageServerLoad } from './$types';
import type { AddOn, Host, ServerClasses, ServerClassJoinAddon } from "$lib/types.ts"
import * as aodf from "$lib/databaseFunctions/addonDatabaseFunctions"
import * as scdf from "$lib/databaseFunctions/serverClassDatabaseFunctions"
import * as df from '$lib/databaseFunctions/hostDatabaseFunctions.js' //example of importing a bunch of functions

export const load: PageServerLoad = async ({ locals }) => {

    let addons: Array<AddOn> = await aodf.getAllAddons();
    let serverClassesByAddon: Array<ServerClassJoinAddon> = await aodf.getAddonsByServerClass();


    let allServerClasses = await scdf.getAllServerClasses()

    addons = addons.sort((a, b) => {
        var textA = a.displayName.toUpperCase();
        var textB = b.displayName.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });

    addons.forEach(x => {
        x.appFolderName = x.addonFileLocation;
    });

    //get all the server classes into 1 object
    let allServerClassesByAddons: any = {};
    for (let scba of serverClassesByAddon) {
        if (typeof allServerClassesByAddons[scba.addonId] == 'undefined') {
            allServerClassesByAddons[scba.addonId] = [];
        }
        allServerClassesByAddons[scba.addonId].push(scba.id);
    }

    //for each server class, get that information
    for (let ad of addons) {
        if (typeof allServerClassesByAddons[ad.id] == 'undefined') {
            ad.serverClassesAssigned = [];
        }
        else {
            ad.serverClassesAssigned = allServerClassesByAddons[ad.id];
        }
    }


    return {
        addons: addons,
        serverClasses: allServerClasses
    }
};

