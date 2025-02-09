import type { PageServerLoad } from './$types';
import type { Host } from "$lib/types.ts"
import * as scdf from "$lib/databaseFunctions/serverClassDatabaseFunctions"
import * as df from '$lib/databaseFunctions/hostDatabaseFunctions.js' //example of importing a bunch of functions
import { isNullOrUndefined } from '$lib/utils';
import { getHosts, insertHost } from '$lib/server/db/models/hosts';
import { getServerClasses, getServerClassByHosts } from '$lib/server/db/models/serverClass';

export const load: PageServerLoad = async ({ locals }) => {
    return {
        'test': 'hello'
    }
};

