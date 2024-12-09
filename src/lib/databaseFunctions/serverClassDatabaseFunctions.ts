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


export const createServerClass = async (serverClassName: string) => {
    //so first of all, delete all the existing entries for serverclass -> host
    let loadDataPromise = new Promise<number>((resolve, reject) => {
        const stmt = db.prepare(`INSERT INTO ServerClasses 
        (name)
        VALUES
        (?);`);

        stmt.run(serverClassName, function (this: RunResult, err: Error | null) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.lastID);
        });
    });

    //await the delete
    let newId = await loadDataPromise;
    return newId;
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


export const deleteServerClass = async (serverClass: ServerClasses) => {
    //so first of all, delete all the existing entries for serverclass -> host
    let sqlPromise = new Promise<void>((resolve, reject) => {
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
    await sqlPromise;



    //delete from the serverclass table
    sqlPromise = new Promise<void>((resolve, reject) => {
        const stmt = db.prepare(`DELETE FROM ServerClasses 
        WHERE id = ?;`);

        stmt.run(serverClass.id, (err: Error | null) => {
            if (err) {
                reject();
                return;
            }
            resolve()
        });
    });

    //await the delete
    await sqlPromise;
}

//***************************************
//BEGIN PRIVATE FUNCTIONS
//***************************************
