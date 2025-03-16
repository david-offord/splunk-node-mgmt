import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { isNullOrUndefined } from '$lib/utils';
import { eq, and } from 'drizzle-orm';
import * as crypto from 'crypto';
import type { LoginModel } from '$lib/types';
import * as  sessionFunc from '../db/models/session';

const MINUTES_UNTIL_EXPIRY = 300;

const checkIfUsernamePasswordValid = async (login: LoginModel) => {
    //hash the password
    let hashedPassword = crypto.hash('sha256', login.password);

    //see if there is a match
    let val = await db
        .select()
        .from(users)
        .where(and(eq(users.hashedPassword, hashedPassword), eq(users.email, login.username), eq(users.disabled, 0)))
        .get();

    //if there was no match, return false
    if (isNullOrUndefined(val))
        return null;

    return val;
};

const loginAndCreateSession = async (userId: string) => {
    let sessionId = await sessionFunc.createSession(userId);
    return sessionId;
};

const checkIdAndPassword = async (userId: string, password: string) => {
    let hashedPassword = crypto.hash('sha256', password);

    //see if there is a match
    let val = await db
        .select()
        .from(users)
        .where(and(eq(users.id, userId), eq(users.hashedPassword, hashedPassword)))
        .get();

    //if there was no match, return false
    if (isNullOrUndefined(val))
        return false;

    return true;
};

export { checkIfUsernamePasswordValid, loginAndCreateSession, checkIdAndPassword };