import { db } from '$lib/server/db/client';
import { addons, hosts, serverClassByAddon, serverClassByHost, users } from '$lib/server/db/schema';
import type { Host } from '$lib/types';
import { like, asc, SQL, getTableColumns, count, eq } from 'drizzle-orm';

const getHosts = async (searchParam: string = '', page: number = 0, pageSize: number = 0, orderBy: string = 'hostname') => {
    let orderByOperator: SQL = null;
    switch (orderBy) {
        case 'hostname':
            orderByOperator = asc(hosts.hostname)
        case 'customerCode':
            orderByOperator = asc(hosts.customerCode)
    }

    let allRows = await db.select({
        ...getTableColumns(hosts),
    })
        .from(hosts)
        .where(like(hosts.hostname, `%${searchParam}%`))
        .orderBy(orderByOperator)
        .limit(pageSize == 0 ? undefined : pageSize)
        .offset(page * pageSize);

    let rowCount = await db.select({
        count: count()
    })
        .from(hosts)
        .where(like(hosts.hostname, `%${searchParam}%`))

    return {
        rows: allRows,
        totalRows: rowCount[0].count
    };

};


const getSingleHost = async (id: number) => {
    let allRows = await db.select({
        ...getTableColumns(hosts),
    })
        .from(hosts)
        .where(eq(hosts.id, id))

    if (allRows.length === 0)
        return null;
    return allRows[0];

};


const getAllAddonsForHost = async (id: number) => {
    let allRows = await db.select({
        ...getTableColumns(addons),
    })
        .from(hosts)
        .innerJoin(serverClassByHost, eq(serverClassByHost.hostId, id))
        .innerJoin(serverClassByAddon, eq(serverClassByHost.serverClassId, serverClassByAddon.serverClassId))
        .innerJoin(addons, eq(addons.id, serverClassByAddon.addonId))
        .where(eq(hosts.id, id))

    return allRows;
};

/**
 * Deletes a host from the DB
 * @param id 
 */
const deleteHost = async (id: number) => {
    //delete from the linking table
    await db.delete(serverClassByHost).where(eq(serverClassByHost.hostId, id));
    //delete from the hosts table
    await db.delete(hosts).where(eq(hosts.id, id));
};

/**
 * Either updates or inserts a host 
 * @param host 
 * @returns 
 */
const addOrUpdateHost = async (host: Host) => {
    //check if host exists
    let existingHost = await getSingleHost(host.id);

    //define the id to return later
    let newHost: Host = null;;

    try {

        if (existingHost == null) {
            newHost = await insertHost(host);
        }
        else {
            newHost = await updateHost(host);
        }

        //update the server class links
        await updateHostServerClasses(host);
    }
    catch (ex) {
        if (typeof ex === "string") {
            console.log(ex.toUpperCase());
        } else if (ex instanceof Error) {
            console.log(ex.message);
        }
    }

    if (newHost != null)
        return newHost.id
    return -1;
}

/**
 * Inserts a host into the table
 * @param host 
 * @returns 
 */
const insertHost = async (host: Host): Promise<Host> => {
    let retVal = await db.insert(hosts).values(host as any).returning();
    if (retVal.length > 0)
        return retVal[0];
    else
        return null;
}

const updateHost = async (host: Host): Promise<Host> => {
    let retVal = await db.update(hosts).set(host).where(eq(hosts.id, host.id)).returning();
    if (retVal.length > 0)
        return retVal[0];
    else
        return null;
}

/**
 * Removes all serverclass -> host entries and replaces them with the new links
 * @param host 
 */
const updateHostServerClasses = async (host: Host) => {
    //delete existing entries of serverclass to host
    await db.delete(serverClassByHost).where(eq(serverClassByHost.hostId, host.id));

    //insert all the server class by addons
    let insertPromises: Promise<any>[] = [];
    for (let i = 0; i < host.serverClassesAssigned.length; i++) {
        const loadDataPromise = db
            .insert(serverClassByHost)
            .values({
                serverClassId: host.serverClassesAssigned[i],
                hostId: host.id
            });


        insertPromises.push(loadDataPromise);
    }
    //await all of the inserts
    await Promise.all(insertPromises);
}


export { getHosts, getSingleHost, getAllAddonsForHost, addOrUpdateHost, deleteHost };