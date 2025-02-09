import type { PageServerLoad } from './$types';
import type { Host } from "$lib/types.ts"
import * as scdf from "$lib/databaseFunctions/serverClassDatabaseFunctions"
import * as adf from "$lib/databaseFunctions/addonDatabaseFunctions"
import * as df from '$lib/databaseFunctions/hostDatabaseFunctions.js' //example of importing a bunch of functions
import { getServerClassPageLoadData } from './serverClassFunctions';

export const load: PageServerLoad = async ({ locals }) => {
    let returnObject = await getServerClassPageLoadData()

    return returnObject;
};

