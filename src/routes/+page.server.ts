import type { PageServerLoad } from './$types';
import type { Host } from "$lib/types.ts"

export const load: PageServerLoad = async ({ locals }) => {
    // Since `sqlite3` is a callback based system, we'll want to use a 
    // promise to return the data in an async manner.
    const loadDataPromise = new Promise<Host[]>((resolve, reject) => {
        const db = locals.db;
        const query = "SELECT * FROM Hosts;";

        db.all<Host>(query, (err: Error | null, rows: Host[]) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows)
        })
    })
    const rows = await loadDataPromise;
    return {
        hosts: rows
    };
};

