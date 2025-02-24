import { db } from '$lib/server/db/client';
import { ansiblePlaybooks, users } from '$lib/server/db/schema';
import type { AnsiblePlaybookModel } from '$lib/types';
import { getTableColumns, eq, sql } from 'drizzle-orm';


const getAnsiblePlaybooks = async () => {
    let retVal = await db
        .select({
            ...getTableColumns(ansiblePlaybooks),
            'createdByName': users.name
        })
        .from(ansiblePlaybooks)
        .innerJoin(users, eq(ansiblePlaybooks.createdBy, users.id));

    return retVal;
}

const getSingleAnsiblePlaybook = async (id: number) => {
    let retVal = await db
        .select({
            ...getTableColumns(ansiblePlaybooks),
            'createdByName': users.name
        })
        .from(ansiblePlaybooks)
        .innerJoin(users, eq(ansiblePlaybooks.createdBy, users.id))
        .where(eq(ansiblePlaybooks.id, id));

    if (retVal?.length > 0)
        return retVal[0];
    return null;
}

const createAnsiblePlaybook = async (playbook: AnsiblePlaybookModel) => {
    let retVal = await db
        .insert(ansiblePlaybooks)
        .values(playbook as any)
        .returning();

    if (retVal?.length > 0)
        return retVal[0];
    return null;
}


const updateAnsiblePlaybook = async (playbook: AnsiblePlaybookModel) => {
    let retVal = await db
        .update(ansiblePlaybooks)
        .set({
            playbookName: playbook.playbookName,
            playbookContents: playbook.playbookContents,
            playbookNotes: playbook.playbookNotes
        })
        .where(eq(ansiblePlaybooks.id, playbook.id))
        .returning();

    if (retVal?.length > 0)
        return retVal[0];
    return null;
}

/**
 * Deletes a playbook based on the Id passed in
 * @param playbookId 
 */
const deleteAnsiblePlaybook = async (playbookId: number) => {
    await db
        .delete(ansiblePlaybooks)
        .where(eq(ansiblePlaybooks.id, playbookId));
}




export {
    getAnsiblePlaybooks,
    getSingleAnsiblePlaybook,
    updateAnsiblePlaybook,
    createAnsiblePlaybook,
    deleteAnsiblePlaybook
};