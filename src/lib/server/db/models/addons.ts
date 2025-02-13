import { db } from '$lib/server/db/client';
import { addons, serverClassByAddon } from '$lib/server/db/schema';
import type { AddOn, Host, ServerClasses } from '$lib/types';
import { like, getTableColumns, count, inArray, eq } from 'drizzle-orm';

const getAllAddons = async (searchParam: string = '', page: number = 0, pageSize: number = 0) => {
    let allRows = await db.select({
        ...getTableColumns(addons),
    })
        .from(addons)
        .where(like(addons.displayName, `%${searchParam}%`))
        .orderBy(addons.displayName)
        .limit(pageSize == 0 ? undefined : pageSize)
        .offset(page * pageSize);

    let rowCount = await db.select({
        count: count()
    })
        .from(addons)
        .where(like(addons.displayName, `%${searchParam}%`))

    return {
        rows: allRows,
        totalRows: rowCount[0].count
    };

};

const getSingleAddon = async (addonId: number) => {
    let allRows = await db.select({
        ...getTableColumns(addons),
    })
        .from(addons)
        .where(eq(addons.id, addonId))

    if (allRows.length === 0)
        return null;

    return allRows[0];
};


const insertNewAddon = async (addon: AddOn) => {
    //delete the id
    delete addon.id;
    //add the add-on first
    let returnId = await db.insert(addons).values(addon as any).returning();

    //insert all the server class by addons
    let insertPromises: Promise<any>[] = [];
    for (let i = 0; i < addon.serverClassesAssigned.length; i++) {
        const loadDataPromise = db
            .insert(serverClassByAddon)
            .values({
                serverClassId: addon.serverClassesAssigned[i],
                addonId: returnId[0].id
            });


        insertPromises.push(loadDataPromise);
    }
    //await all of the inserts
    await Promise.all(insertPromises);

    return returnId;
}

const updateAddon = async (addon: AddOn) => {
    //delete the serverclass by addon definitions
    await db.delete(serverClassByAddon).where(eq(serverClassByAddon.addonId, addon.id));

    //update the actual add-on
    await db.update(addons).set(addon).where(eq(addons.id, addon.id));

    //insert all the server class by addons
    let insertPromises: Promise<any>[] = [];
    for (let i = 0; i < addon.serverClassesAssigned.length; i++) {
        const loadDataPromise = db
            .insert(serverClassByAddon)
            .values({
                serverClassId: addon.serverClassesAssigned[i],
                addonId: addon.id
            });


        insertPromises.push(loadDataPromise);
    }
    //await all of the inserts
    await Promise.all(insertPromises);

}

const deleteAddon = async (addonId: number) => {
    //delete all entries of this from the add-on by server class
    await db.delete(serverClassByAddon).where(eq(serverClassByAddon.addonId, addonId))

    //delete it
    await db.delete(addons).where(eq(addons.id, addonId));
}



export {
    getAllAddons,
    deleteAddon,
    insertNewAddon,
    updateAddon,
    getSingleAddon
};