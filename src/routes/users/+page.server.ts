import type { PageServerLoad } from './$types';
import type { AddOn } from "$lib/types.ts"
import { getUsersAndPermissions } from '$lib/server/db/models/userPermissions';

export const load: PageServerLoad = async ({ locals }) => {
    //get all addons
    let allusers = await getUsersAndPermissions();

    return {
        users: allusers,
    }
};

