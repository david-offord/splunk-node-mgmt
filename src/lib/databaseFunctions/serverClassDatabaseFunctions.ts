import type { ServerClasses, HostJoinServerClass } from "$lib/types.ts"
import sqlite3 from 'sqlite3';
import type { Database, Statement, RunResult } from 'sqlite3'
import db from '$lib/server/db';

//***************************************
//BEGIN PUBLIC FACING FUNCTIONS
//***************************************
//gets a list of every host
export const getAllServerClasses = async () => {
    const loadDataPromise = new Promise<ServerClasses[]>((resolve, reject) => {
        const query = "SELECT * FROM ServerClasses;";

        db.all<ServerClasses>(query, (err: Error | null, rows: ServerClasses[]) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows)
        })
    });
    const rows = await loadDataPromise;

    return rows;
};

//gets all server classes by host, with the host definitions
export const getAllServerClassesByHosts = async () => {
    const loadDataPromise = new Promise<HostJoinServerClass[]>((resolve, reject) => {
        const query = `SELECT sc.id AS serverClassId, h.*
            FROM serverClasses sc
            INNER JOIN serverClassByHost sch ON sch.serverClassId = sc.id
            INNER JOIN hosts h ON sch.hostId = h.id;`;

        db.all<HostJoinServerClass>(query, (err: Error | null, rows: HostJoinServerClass[]) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows)
        })
    });

    const rows = await loadDataPromise;
    return rows;
}

export const updateServerClassHosts = async (serverClass: ServerClasses) => {
    //so first of all, delete all the existing entries for serverclass -> host
    let loadDataPromise = new Promise<void>((resolve, reject) => {
        const stmt = db.prepare(`DELETE FROM serverClassByHost 
        WHERE serverClassId = ?;`);

        stmt.run(serverClass.id, (err: Error | null) => {
            if (err) {
                reject();
                return;
            }
            resolve()
        });
    });

    //await the delete
    await loadDataPromise;

    //now, run the insert for every host
    let query = `INSERT INTO serverClassByHost 
            (serverClassId, hostId)
            VALUES
            (?,?)`

    //prep the statement
    const stmt = db.prepare(query);

    let insertPromises: Promise<void>[] = [];

    //do it for every host assigned
    for (let i = 0; i < serverClass.hostsAssigned.length; i++) {
        loadDataPromise = new Promise<void>((resolve, reject) => {
            //run the insert
            stmt.run(serverClass.id, serverClass.hostsAssigned[i].id, (err: Error | null) => {
                if (err) {
                    reject();
                    return;
                }
                resolve()
            });
        });
        insertPromises.push(loadDataPromise);
    }
    await Promise.all(insertPromises);
    console.log('aaaa');
}


//***************************************
//BEGIN PRIVATE FUNCTIONS
//***************************************
