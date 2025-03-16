import type { Handle } from '@sveltejs/kit';
import sqlite3 from 'sqlite3';
import { isNullOrUndefined } from '$lib/utils';
import { getUserBySession, createSession } from '$lib/server/db/models/session';
import { getUserPermissions } from '$lib/server/db/models/userPermissions';



export const handle: Handle = async ({ event, resolve }) => {
    if (!event.locals.db) {
        // This will create the database within the `db.sqlite` file.
        const db = new sqlite3.Database('data.db', (err) => {
            if (err) {
                throw err;
            }
        });

        // Set the db as our events.db variable.
        event.locals.db = db
    }

    //get the session key, and user if already signed in
    let sessionKey = event.cookies.get('snmSessionKey');
    if (isNullOrUndefined(sessionKey) === false) {
        event.locals.user = await getUserBySession(sessionKey);
    }

    if (event.locals.user)
        event.locals.userPermissions = await getUserPermissions(event.locals.user.id);
    else
        event.locals.userPermissions = null;



    const resp = await resolve(event);
    return resp;
};