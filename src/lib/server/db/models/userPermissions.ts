import { db } from '$lib/server/db/client';
import { userPermissions, users } from '$lib/server/db/schema';
import type { UserWithPermissions } from '$lib/types';
import { eq, getTableColumns } from 'drizzle-orm';

const getUsersAndPermissions = async () => {
    let allUsers: UserWithPermissions[] = await db.select({
        ...getTableColumns(users),
        ...getTableColumns(userPermissions),
        userId: users.id
    })
        .from(users)
        .leftJoin(userPermissions, eq(users.id, userPermissions.userId))

    return allUsers;
};

const getUserPermissions = async (userid: string) => {
    let user = await db.select({
        ...getTableColumns(userPermissions),
    })
        .from(userPermissions)
        .where(eq(userPermissions.userId, userid))
        .get();

    return user;
};

const updateUserPermissions = async (userId: string, user: UserWithPermissions) => {
    //check if there is a permissions row already present
    let existingRow = await getUserPermissions(userId);

    //update if it already exists
    if (existingRow) {
        await db
            .update(userPermissions)
            .set(user)
            .where(eq(userPermissions.userId, userId));
    } else {
        //insert if it doesn't exist
        await db
            .insert(userPermissions)
            .values({
                userId: userId,
                ...user
            });
    }

};


export { getUsersAndPermissions, updateUserPermissions, getUserPermissions };