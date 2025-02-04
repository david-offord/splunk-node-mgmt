import { isNullOrUndefined } from '$lib/utils';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types'

const URLS_THAT_REQUIRE_NO_AUTH = ['/login', '/serverclass']

export const load: LayoutServerLoad = ({ url, locals, cookies }) => {

    cookies.set('test', 'test', {
        'path': '/'
    });

    //if they arent authed, and the url is not in the list of ones that dont require auth
    ///if (isNullOrUndefined(cookies.get('userToken')) && URLS_THAT_REQUIRE_NO_AUTH.indexOf(url.pathname) === -1) {
    ///    throw redirect(301, '/login');
    ///}
}