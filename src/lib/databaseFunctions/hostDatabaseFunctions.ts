import type { AddOn, Host, HostJoinServerClass } from "$lib/types.ts"
import sqlite3 from 'sqlite3';
import type { Database, Statement, RunResult } from 'sqlite3'
import db from '$lib/server/db';

//***************************************
//BEGIN PUBLIC FACING FUNCTIONS
//***************************************

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


//gets a list of every host
export const getAllHostsOnlyNamesAndIds = async () => {
    const loadDataPromise = new Promise<Host[]>((resolve, reject) => {
        const query = "SELECT id,hostname FROM Hosts;";

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

        //update the server class links
        updateHostLinksToServerClass(updateHost);
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

export const deleteSingleHost = async (hostId: number) => {
    let loadDataPromise = new Promise<Host[]>((resolve, reject) => {
        const query = `DELETE FROM serverClassByHost WHERE hostId=${hostId};`;

        db.all<Host>(query, (err: Error | null, rows: Host[]) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows)
        })
    });
    await loadDataPromise;

    loadDataPromise = new Promise<Host[]>((resolve, reject) => {
        const query = `DELETE FROM Hosts WHERE id=${hostId};`;

        db.all<Host>(query, (err: Error | null, rows: Host[]) => {
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

export const getAllAddonsForHost = async (hostId: number) => {
    const loadDataPromise = new Promise<AddOn[]>((resolve, reject) => {
        const query = ` SELECT a.*
                        FROM serverClassByHost scbh
                        JOIN serverClassByAddon scba ON scbh.serverClassId = scba.serverClassId
                        JOIN addons a on scba.addonId = a.id
                        WHERE scbh.hostid = '${hostId}';`;

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
}

export const getServerClassByHosts = async () => {
    const loadDataPromise = new Promise<HostJoinServerClass[]>((resolve, reject) => {
        const query = ` SELECT sch.hostId as id , sch.serverClassId
                        FROM serverClassByHost sch`;

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
const insertNewHost = async (host: Host) => {
    const loadDataPromise = new Promise<number>((resolve, reject) => {
        const stmt = db.prepare(`INSERT INTO Hosts 
        ( customerCode, ipAddress, hostname, ansibleName, linuxUsername, splunkHomePath, splunkRestartCommand, splunkManagementPort)
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(host.customerCode,
            host.ipAddress,
            host.hostname,
            host.hostname.replaceAll('-', '_').replaceAll(' ', '_') + '_' + host.customerCode,
            host.linuxUsername,
            host.splunkHomePath,
            host.splunkRestartCommand,
            host.splunkManagementPort,
            function (this: RunResult, err: Error | null) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this.lastID);
            });
    });

    //check how many rows came back
    const newId: number = await loadDataPromise;
    return newId;
}

//Get a single host based on ID. Returns null if no host is found
const updateExistingHost = async (host: Host) => {
    const loadDataPromise = new Promise<Host[]>((resolve, reject) => {
        const stmt = db.prepare(`UPDATE Hosts 
        SET customerCode=?, ipAddress=?, hostname=?, ansibleName=?, linuxUsername=?, splunkHomePath=?, splunkRestartCommand=?, splunkManagementPort=?
        WHERE id=?;
        `);

        stmt.run(host.customerCode,
            host.ipAddress,
            host.hostname,
            host.hostname.replaceAll('-', '_').replaceAll(' ', '_') + '_' + host.customerCode,
            host.linuxUsername,
            host.splunkHomePath,
            host.splunkRestartCommand,
            host.splunkManagementPort,
            host.id,
            (err: Error | null, rows: Host[]) => {
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

//Get a single host based on ID. Returns null if no host is found
const updateHostLinksToServerClass = async (host: Host) => {
    //delete all the server class by host entries for this host
    const deleteScPromise = new Promise<void>((resolve, reject) => {
        const stmt = db.prepare(`DELETE FROM serverClassByHost WHERE hostId = ?;`);
        stmt.run(host.id,
            (err: Error | null) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve()
            });
    });

    //check how many rows came back
    await deleteScPromise;

    //add new entries for each server class
    let insertPromises: Promise<void>[] = [];
    const stmt = db.prepare(`INSERT INTO serverClassByHost (serverClassId, hostId)
                            VALUES (?, ?);`);
    //do it for every host assigned
    for (let serverClassId of host.serverClassesAssigned) {
        let loadDataPromise = new Promise<void>((resolve, reject) => {
            stmt.run(serverClassId, host.id,
                (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve()
                });
        })
        insertPromises.push(loadDataPromise);
    }
    await Promise.all(insertPromises);
}

