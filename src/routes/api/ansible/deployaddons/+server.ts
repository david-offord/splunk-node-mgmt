import { fail, json } from '@sveltejs/kit';
import type { Host, ValidationObject } from "$lib/types.ts"
import type { RequestHandler } from './$types';
import * as df from '$lib/databaseFunctions/hostDatabaseFunctions.js' //example of importing a bunch of functions
import * as amf from '$lib/workingDirectoryFunctions/ansibleManagementFunctions' //example of importing a bunch of functions

//for updating/adding host
export const POST: RequestHandler = async function POST({ request }) {
    let host = await request.json() as Host;

    //get stuff from db
    let fullHost = await df.getSingleHost(host.id);
    let allAddonsForHost = await df.getAllAddonsForHost(host.id);

    //call the function that will do this
    await amf.deployAddonsToHost(fullHost, allAddonsForHost);

    return json({ host: host });
} 
