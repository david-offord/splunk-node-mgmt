import { fail, json } from '@sveltejs/kit';
import type { UserWithPermissions } from "$lib/types.ts"
import type { RequestHandler } from './$types';
import { canUserAccessApi, } from '$lib/utils';
import { checkIdAndPassword } from '$lib/server/auth/authenticate';
import { updateUserPassword } from '$lib/server/db/models/user';

//for updating user
export const PATCH: RequestHandler = async function PATH({ request, locals, url }) {
    //no api auth check as they should always be able to do this
    let passwordChangeData = await request.json();

    //check to make sure this is actually the user's password
    console.log(passwordChangeData);
    let correctPassword = await checkIdAndPassword(locals.user?.id, passwordChangeData.currentPassword);

    if (correctPassword === false) {
        return json("Current password is incorrect.", {
            status: 401,
        })
    }

    //attempt to update
    await updateUserPassword(locals.user?.id, passwordChangeData.newPassword);


    return json(null);
}
