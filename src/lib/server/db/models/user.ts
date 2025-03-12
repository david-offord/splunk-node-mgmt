import { db } from '$lib/server/db/client';
import { userPermissions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const getUserByEmail = async (email: string) => {
    return await db.select().from(users).where(eq(users.email, email)).get();
};

const createNewUser = async (data: any) => {
    let newUser = await db
        .insert(users)
        .values(data)
        .returning();

    if (newUser.length === 0) {
        throw new Error('Failed to create new user');
    }
    return newUser[0];
};

const updateUser = async (id: string, email: string, displayName: string) => {
    await db
        .update(users)
        .set({
            email: email,
            name: displayName
        } as any)
        .where(eq(users.id, id));
};


const deleteUser = async (id: string) => {
    //first delete permissions
    await db
        .delete(userPermissions)
        .where(eq(userPermissions.userId, id));

    //mark the user as disabled
    await db
        .update(users)
        .set({
            disabled: 1
        } as any)
        .where(eq(users.id, id));
};

export { createNewUser, getUserByEmail, updateUser, deleteUser };