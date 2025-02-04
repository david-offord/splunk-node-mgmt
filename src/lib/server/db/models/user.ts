import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const getUserByEmail = async (email: string) => {
    return await db.select().from(users).where(eq(users.email, email)).get();
};

const createNewUser = async (data: typeof users.$inferInsert) => {
    await db.insert(users).values(data);
};

export { createNewUser, getUserByEmail };