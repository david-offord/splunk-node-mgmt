import { json } from '@sveltejs/kit';
import type { Host } from "$lib/types.ts"
import * as df from '$lib/databaseFunctions.js' //example of importing a bunch of functions
import * as af from '$lib/ansibleFunctions.js' //example of importing a bunch of functions

//for updating/adding host
export async function POST({ request }) {
    //get the host from the request
    let host: Host = await request.json();

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