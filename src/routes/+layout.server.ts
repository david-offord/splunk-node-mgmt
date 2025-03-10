import { isNullOrUndefined } from '$lib/utils';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types'
import { getUserBySession } from '$lib/server/db/models/session';

const URLS_THAT_REQUIRE_NO_AUTH = ['/login']

export const load: LayoutServerLoad = async ({ url, locals, cookies }) => {

    //get the session key, and user if already signed in
    let sessionKey = cookies.get('snmSessionKey');
    if (isNullOrUndefined(sessionKey) === false) {
        locals.user = await getUserBySession(sessionKey);
    }

    //if they arent authed, and the url is not in the list of ones that dont require auth
    if (isNullOrUndefined(locals.user) && URLS_THAT_REQUIRE_NO_AUTH.indexOf(url.pathname) === -1) {

        if (isNullOrUndefined(locals.urlBeforeLogin)) {
            locals.urlBeforeLogin = url.pathname;
        }

        throw redirect(301, '/login');
    }

    if (isNullOrUndefined(locals.urlBeforeLogin) === false) {
        let tempPath = locals.urlBeforeLogin;
        locals.urlBeforeLogin = null;
        throw redirect(301, tempPath);
    }

    return {
        user: {
            //@ts-ignore
            userName: locals.user?.name
        }
    };
}