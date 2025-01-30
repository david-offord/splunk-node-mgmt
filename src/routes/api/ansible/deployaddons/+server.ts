import { fail, json } from '@sveltejs/kit';
import type { Host, ValidationObject } from "$lib/types.ts"
import type { RequestHandler } from './$types';
import * as df from '$lib/databaseFunctions/hostDatabaseFunctions.js' //example of importing a bunch of functions
import * as amf from '$lib/managementFunctions/ansibleManagementFunctions' //example of importing a bunch of functions
import Queue from 'yocto-queue';
import * as utils from '$lib/utils';
import { debugRefreshSplunk } from '$lib/managementFunctions/splunkManagementFunctions';

//for updating/adding host
export const POST: RequestHandler = async function POST({ request }) {
    let host = await request.json() as Host;

    //get stuff from db
    let fullHost = await df.getSingleHost(host.id);
    let allAddonsForHost = await df.getAllAddonsForHost(host.id);

    //call the function that will do this
    await amf.deployAddonsToHost(fullHost, allAddonsForHost);

    //delete any old add-ons we dont manage now
    await amf.deleteAddonsNoLongerManaged(fullHost, allAddonsForHost);

    return json({ host: host });
}

//for updating/adding host
export const PATCH: RequestHandler = async function POST({ request }) {
    //get stuff from db
    let allHosts = await df.getAllHosts();

    let allPromises: Promise<void>[] = [];
    let resolvedPromises = 0;
    let logs = new Queue<string>();

    //for every host, trigger the deployment
    for (let host of allHosts) {
        let deploymentPromise = new Promise<void>(async (resolve, reject) => {
            try {
                logs.enqueue(`Getting all add-ons for ${host.hostname}...`);
                let allAddonsForHost = await df.getAllAddonsForHost(host.id);

                logs.enqueue(`Got all add-ons for host ${host.hostname}. Deploying...`);
                //call the function that will do this
                await amf.deployAddonsToHost(host, allAddonsForHost);

                logs.enqueue(`Finished deploying ${host.hostname}.`);
            }
            catch (ex) {
                logs.enqueue(`Error deploying ${host.hostname}. Error: ${ex}`);
            }

            resolvedPromises++;
            resolve();
        });

        allPromises.push(deploymentPromise);
    }

    // Wait for all promises to resolve
    while (resolvedPromises < allPromises.length) {
        utils.logDebug(logs.dequeue());
        await utils.sleep(100)
    }
    //print out anything else
    while (utils.isNullOrUndefined(logs.peek())) {
        utils.logDebug(logs.dequeue());
    }

    //await all of them
    await Promise.all(allPromises);

    utils.logDebug("Completed add-on push.");

    return json({ success: true });
} 