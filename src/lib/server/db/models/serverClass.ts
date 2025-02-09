import { db } from '$lib/server/db/client';
import { serverClassByAddon, serverClassByHost, serverClasses, users } from '$lib/server/db/schema';
import type { AddOn, Host, ServerClasses } from '$lib/types';
import { like, getTableColumns, count, inArray, eq } from 'drizzle-orm';

const getServerClasses = async (searchParam: string = '', page: number = 0, pageSize: number = 0) => {

    let allRows = await db.select({
        ...getTableColumns(serverClasses),
    })
        .from(serverClasses)
        .where(like(serverClasses.name, `%${searchParam}%`))
        .orderBy(serverClasses.name)
        .limit(pageSize == 0 ? undefined : pageSize)
        .offset(page * pageSize);

    let rowCount = await db.select({
        count: count()
    })
        .from(serverClasses)
        .where(like(serverClasses.name, `%${searchParam}%`))

    return {
        rows: allRows,
        totalRows: rowCount[0].count
    };

};

const insertNewServerClass = async (serverClassName: string) => {
    let returnId = await db.insert(serverClasses).values({ name: serverClassName }).returning();
    return returnId;
}

const deleteServerClass = async (serverClassId: number) => {
    //delete it
    await db.delete(serverClasses).where(eq(serverClasses.id, serverClassId));
}

const getServerClassByHosts = async (hosts: number[]) => {
    let allRows = await db.select({
        id: serverClassByHost.hostId,
        serverClassId: serverClassByHost.serverClassId
    })
        .from(serverClassByHost)
        .where(inArray(serverClassByHost.hostId, hosts))

    return allRows;
}

const updateServerClassAddons = async (serverClassId: number, addons: AddOn[]) => {
    //first, delete all the addons associated with this serverclass
    await db.delete(serverClassByAddon).where(eq(serverClassByAddon.serverClassId, serverClassId));

    //create an array with all the values
    let newAddonServers = [];
    for (let add of addons) {
        newAddonServers.push({
            serverClassId: serverClassId,
            addonId: add.id
        });
    }

    //with them deleted, add in the new ones
    await db.insert(serverClassByAddon).values(newAddonServers)
}


const updateServerClassHosts = async (serverClassId: number, hosts: Host[]) => {
    //first, delete all the addons associated with this serverclass
    await db.delete(serverClassByHost).where(eq(serverClassByHost.serverClassId, serverClassId));

    //create an array with all the values
    let newHostsServer = [];
    for (let h of hosts) {
        newHostsServer.push({
            serverClassId: serverClassId,
            hostId: h.id
        });
    }

    //with them deleted, add in the new ones
    await db.insert(serverClassByHost).values(newHostsServer)
}


export {
    getServerClasses,
    insertNewServerClass,
    getServerClassByHosts,
    updateServerClassAddons,
    updateServerClassHosts,
    deleteServerClass
};