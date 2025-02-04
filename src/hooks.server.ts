import type { Handle } from '@sveltejs/kit';
import type { Reroute } from '@sveltejs/kit';
import sqlite3 from 'sqlite3';
import { redirect } from '@sveltejs/kit';


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

    const resp = await resolve(event);
    return resp;
};