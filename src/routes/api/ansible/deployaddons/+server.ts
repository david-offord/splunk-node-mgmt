import { fail, json } from '@sveltejs/kit';
import type { Host, ValidationObject } from "$lib/types.ts"
import type { RequestHandler } from './$types';
import Queue from 'yocto-queue';

import * as amf from '$lib/managementFunctions/ansibleManagementFunctions' //example of importing a bunch of functions
import * as utils from '$lib/utils';
import { getAllAddonsForHost, getHosts, getSingleHost } from '$lib/server/db/models/hosts';
import { log } from 'console';
import { addJobLog, completeJob, createJob } from '$lib/server/db/models/jobs';

//for updating/adding host
export const POST: RequestHandler = async function POST({ request, locals }) {
    let host = await request.json() as Host;


    //get stuff from db
    let fullHost = await getSingleHost(host.id);
    let allAddonsForHost = await getAllAddonsForHost(host.id);

    //create job for logging
    let logJobId = await createJob(`Deploying Addons for single host ${host.hostname}; hostname=${host.hostname}; id=${host.id}; numberOfAddons=${allAddonsForHost.length}`, locals.user.id);

    //log that we are starting
    await addJobLog(logJobId, `Starting deployment for host ${host.hostname}`);

    //call the function that will do this
    await amf.deployAddonsToHost(fullHost, allAddonsForHost, logJobId);

    //delete any old add-ons we dont manage now
    await amf.deleteAddonsNoLongerManaged(fullHost, allAddonsForHost, logJobId);

    //mark job completed
    await completeJob(logJobId);
    return json({ host: host });
}

//for deploying all hosts
export const PATCH: RequestHandler = async function POST({ request }) {
    //get stuff from db
    let allHostInfo = await getHosts();
    let allHosts = (await allHostInfo).rows;

    let allPromises: Promise<void>[] = [];
    let resolvedPromises = 0;
    let logs = new Queue<string>();

    //for every host, trigger the deployment
    for (let host of allHosts) {
        let deploymentPromise = new Promise<void>(async (resolve, reject) => {
            try {
                logs.enqueue(`Getting all add-ons for ${host.hostname}...`);
                let allAddonsForHost = await getAllAddonsForHost(host.id);

                if (allAddonsForHost.length === 0)
                    logs.enqueue(`Host ${host.hostname} had no add-ons to deploy. Skipping.`)
                else
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