import { fail, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { LoginModel } from '$lib/types';
import { checkIfUsernamePasswordValid, loginAndCreateSession } from '$lib/server/auth/authenticate';
import { isNullOrUndefined } from '$lib/utils';

//create new server class
export const POST: RequestHandler = async function POST({ request }) {
    //get it into a login object
    let loginInformation: LoginModel = null;
    loginInformation = await request.json() as LoginModel;

    //check if the login is valid
    let validUser = await checkIfUsernamePasswordValid(loginInformation)

    //return a 401 if not valid
    if (isNullOrUndefined(validUser)) {
        return json('Not a valid login.', {
            status: 401
        });
    }

    //login and get the session ID
    let sessionId = await loginAndCreateSession(validUser.id);


    return json(sessionId);
}
