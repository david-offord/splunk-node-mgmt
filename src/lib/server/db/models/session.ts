import { db } from '$lib/server/db/client';
import { sessions, users } from '$lib/server/db/schema';
import { isNullOrUndefined } from '$lib/utils';
import { eq, lt, and } from 'drizzle-orm';
import * as crypto from 'crypto';

const MINUTES_UNTIL_EXPIRY = 300;

const getUserBySession = async (sessionId: string) => {
    let val = await db.select().from(sessions).where(and(eq(sessions.id, sessionId), lt(sessions.expiresAt, Date.now()))).get();

    //if there is no session, return null
    if (isNullOrUndefined(val))
        return null;

    //if the expires at is past the current time
    if (val.expiresAt < (Date.now() / 1000))
        return null;

    //get user based on that ID
    let user = await db.select().from(users).where(eq(users.id, val.userId)).get();
    if (isNullOrUndefined(user))
        return null;

    //return the user
    return user;
};

const createSession = async (userId: string): Promise<string> => {
    //generate a session id
    let sessionId = crypto.randomBytes(32).toString('base64');

    //delete any session associated with this userid
    await db.delete(sessions).where(eq(sessions.userId, userId));

    //create a new session
    let newSession = await db.insert(sessions).values({
        //get seconds as of now + minutes till expiry
        expiresAt: Math.floor(Date.now() / 1000) + (60 * MINUTES_UNTIL_EXPIRY),
        userId: userId,
    }).returning();

    //if it failed, return null
    if (isNullOrUndefined(newSession) || newSession.length == 0)
        return null;

    //otherwise, give the session id
    return newSession[0].id;
};


export { getUserBySession, createSession };