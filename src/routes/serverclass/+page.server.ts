import { addons, hosts } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';
import { getServerClassPageLoadData } from './serverClassFunctions';

export const load: PageServerLoad = async ({ locals, parent }) => {
    let returnObject = await getServerClassPageLoadData()

    return {
        parent: await parent(),
        serverClasses: returnObject.serverClasses,
        addons: returnObject.addons,
        hosts: returnObject.hosts,
    };
};

