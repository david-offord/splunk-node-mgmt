import type { Host } from "$lib/types.ts"
import sqlite3 from 'sqlite3';
import type { Database } from 'sqlite3'
import db from '$lib/server/db';

//BEGIN PUBLIC FACING FUNCTIONS

//gets a list of every host
export const getAllHosts = async () => {
    const loadDataPromise = new Promise<Host[]>((resolve, reject) => {
        const query = "SELECT * FROM Hosts;";

        db.all<Host>(query, (err: Error | null, rows: Host[]) => {
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

//Get a single host based on ID. Returns null if no host is found
export const getSingleHost = async (hostId: number) => {
    const loadDataPromise = new Promise<Host[]>((resolve, reject) => {
        const query = `SELECT * FROM Hosts where id=${hostId};`;

        db.all<Host>(query, (err: Error | null, rows: Host[]) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows)
        })
    });
    //check how many rows came back
    const rows = await loadDataPromise;
    //if it got a row, then return the first row
    if (rows.length > 0)
        return rows[0];
    return null;
}

//adds or updates an existing host
export const addUpdateHost = async (updateHost: Host) => {
    //check if host exists
    let existingHost = await getSingleHost(updateHost.id);

    //define the id to return later
    let id: number = -1;

    try {

        if (existingHost == null) {
            id = await insertNewHost(updateHost);
        }
        else {
            await updateExistingHost(updateHost);
            id = existingHost.id;
        }
    }
    catch (ex) {
        if (typeof ex === "string") {
            console.log(ex.toUpperCase());
        } else if (ex instanceof Error) {
            console.log(ex.message);
        }
    }

    return id;
}


//BEGIN PRIVATE FUNCTIONS
//Load the database file
const loadDb = async () => {
    const db = new sqlite3.Database('data.db', (err) => {
        if (err) {
            throw err;
        }
    });

    return db;
};


//Get a single host based on ID. Returns null if no host is found
const insertNewHost = async (host: Host) => {
    const loadDataPromise = new Promise<Host[]>((resolve, reject) => {
        const stmt = db.prepare(`INSERT INTO Hosts 
        ( customerCode, ipAddress, hostname, ansibleName)
        VALUES
        (?, ?, ?, ?)
        `);

        stmt.run(host.customerCode, host.ipAddress, host.hostname, host.customerCode + '_' + host.hostname.replace('-', '_'), (err: Error | null, rows: Host[]) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows)
        });
    });

    //check how many rows came back
    const row = await loadDataPromise;
    return row[0].id;
}

//Get a single host based on ID. Returns null if no host is found
const updateExistingHost = async (host: Host) => {
    const loadDataPromise = new Promise<Host[]>((resolve, reject) => {
        const stmt = db.prepare(`UPDATE Hosts 
        SET customerCode=?, ipAddress=?, hostname=?, ansibleName=?
        WHERE id=?;
        `);

        stmt.run(host.customerCode, host.ipAddress, host.hostname, host.customerCode + '_' + host.hostname.replace('-', '_'), host.id, (err: Error | null, rows: Host[]) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows)
        });

    });

    //check how many rows came back
    const rows = await loadDataPromise;
    return rows;
}
