import type { PageServerLoad } from './$types';
import type { AddOn } from "$lib/types.ts"
import { getServerClassByAddon, getServerClasses } from '$lib/server/db/models/serverClass';
import { getAllAddons } from '$lib/server/db/models/addons';

export const load: PageServerLoad = async ({ locals, parent }) => {
    //get all addons
    let addonsInformation = await getAllAddons();
    let addons: Array<AddOn> = addonsInformation.rows;

    //make an array of only ids for the next function
    let addonIds = addons.map(x => x.id);
    let serverClassesByAddon = await getServerClassByAddon(addonIds);

    //get all server classes
    let serverClassInformation = await getServerClasses();
    let allServerClasses = serverClassInformation.rows;

    addons = addons.sort((a, b) => {
        var textA = a.displayName.toUpperCase();
        var textB = b.displayName.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
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
        parent: await parent(),
        addons: addons,
        serverClasses: allServerClasses
    }
};

