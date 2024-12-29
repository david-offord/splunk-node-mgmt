import type { AddOn, Host, ServerClassJoinAddon } from "$lib/types.ts"
import sqlite3 from 'sqlite3';
import type { Database, Statement, RunResult } from 'sqlite3'
import db from '$lib/server/db';

//***************************************
//BEGIN PUBLIC FACING FUNCTIONS
//***************************************

//gets a list of every host
export const getAllAddons = async () => {
    const loadDataPromise = new Promise<AddOn[]>((resolve, reject) => {
        const query = "SELECT * FROM addons;";

        db.all<AddOn>(query, (err: Error | null, rows: AddOn[]) => {
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


//Get a single addon based on ID. Returns null if no host is found
export const getSingleAddon = async (addonId: number) => {
    const loadDataPromise = new Promise<AddOn[]>((resolve, reject) => {
        const query = `SELECT * FROM addons where id=${addonId};`;

        db.all<AddOn>(query, (err: Error | null, rows: AddOn[]) => {
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
export const addUpdateAddon = async (updateAddon: AddOn) => {
    //check if host exists
    let existingAddon = await getSingleAddon(updateAddon.id);

    //define the id to return later
    let id: number = -1;

    try {

        if (existingAddon == null) {
            id = await insertNewAddon(updateAddon);
        }
        else {
            await updateExistingAddon(updateAddon);
            id = existingAddon.id;
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


export const deleteSingleAddon = async (addonId: number) => {
    let loadDataPromise = new Promise<AddOn[]>((resolve, reject) => {
        const query = `DELETE FROM serverClassByAddon WHERE addonId=${addonId};`;

        db.all<AddOn>(query, (err: Error | null, rows: AddOn[]) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows)
        })
    });
    await loadDataPromise;

    loadDataPromise = new Promise<AddOn[]>((resolve, reject) => {
        const query = `DELETE FROM addons WHERE id=${addonId};`;

        db.all<AddOn>(query, (err: Error | null, rows: AddOn[]) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows)
        })
    });

    await loadDataPromise;

    return true;
}
//gets all server classes by host, with the host definitions
export const getAddonsByServerClass = async () => {
    const loadDataPromise = new Promise<ServerClassJoinAddon[]>((resolve, reject) => {
        const query = `SELECT a.id AS addonId, sc.*
            FROM addons a
            INNER JOIN serverClassByAddon sca ON sca.addonId = a.id
            INNER JOIN serverClasses sc ON sca.serverClassId = sc.id;`;

        db.all<ServerClassJoinAddon>(query, (err: Error | null, rows: ServerClassJoinAddon[]) => {
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


//***************************************
//BEGIN PRIVATE FUNCTIONS
//***************************************


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
const insertNewAddon = async (addon: AddOn) => {
    //do the actual insert of the addon
    const insertPromise = new Promise<number>((resolve, reject) => {
        const stmt = db.prepare(`INSERT INTO  addons
        ( displayName, addonFileLocation, addonIgnoreFileOption, actionOnInstallation)
        VALUES
        (?, ?, ?, ?)
        `);

        stmt.run(addon.displayName,
            addon.addonFileLocation,
            addon.addonIgnoreFileOption,
            addon.actionOnInstallation,
            function (this: RunResult, err: Error | null) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this.lastID);
            });
    });
    const newId: number = await insertPromise;

    //now, run the insert into the joined table
    let query = `INSERT INTO serverClassByAddon
            (serverClassId, addonId)
            VALUES
            (?,?)`

    //prep the statement
    const stmt = db.prepare(query);
    let insertPromises: Promise<void>[] = [];

    //do it for every host assigned
    for (let i = 0; i < addon.serverClassesAssigned.length; i++) {
        const loadDataPromise = new Promise<void>((resolve, reject) => {
            //run the insert
            stmt.run(addon.serverClassesAssigned[i], newId, (err: Error | null) => {
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

    //return the new entry
    return newId;
}

//Get a single host based on ID. Returns null if no host is found
const updateExistingAddon = async (addon: AddOn) => {
    //delete all the rows in the joined table
    let loadDataPromise = new Promise<void>((resolve, reject) => {
        const stmt = db.prepare(`DELETE FROM serverClassByAddon
        WHERE addonId = ?;`);

        stmt.run(addon.id, (err: Error | null) => {
            if (err) {
                reject();
                return;
            }
            resolve()
        });
    });

    await loadDataPromise;

    //now, run the insert for every host
    let query = `INSERT INTO serverClassByAddon
            (serverClassId, addonId)
            VALUES
            (?,?)`

    //prep the statement
    const stmt = db.prepare(query);
    let insertPromises: Promise<void>[] = [];

    //do it for every host assigned
    for (let i = 0; i < addon.serverClassesAssigned.length; i++) {
        const loadDataPromise = new Promise<void>((resolve, reject) => {
            //run the insert
            stmt.run(addon.serverClassesAssigned[i], addon.id, (err: Error | null) => {
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


    //do the actual update
    const insertPromise = new Promise<number>((resolve, reject) => {
        const stmt = db.prepare(`UPDATE addons
        SET displayName = ?, addonFileLocation = ?, addonIgnoreFileOption = ?, actionOnInstallation = ?
        WHERE id = ?
        `);

        stmt.run(addon.displayName,
            addon.addonFileLocation,
            addon.addonIgnoreFileOption,
            addon.actionOnInstallation,
            addon.id,
            function (this: RunResult, err: Error | null) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this.lastID);
            });
    });

}
