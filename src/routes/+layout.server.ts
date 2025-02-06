import { isNullOrUndefined } from '$lib/utils';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types'

const URLS_THAT_REQUIRE_NO_AUTH = ['/login']

export const load: LayoutServerLoad = ({ url, locals, cookies }) => {
    //if they arent authed, and the url is not in the list of ones that dont require auth
    if (isNullOrUndefined(locals.user) && URLS_THAT_REQUIRE_NO_AUTH.indexOf(url.pathname) === -1) {
        throw redirect(301, '/login');
    }

}