import { fail, json } from '@sveltejs/kit';
import type { UserWithPermissions } from "$lib/types.ts"
import type { RequestHandler } from './$types';
import { createNewUser, deleteUser, updateUser } from '$lib/server/db/models/user';
import { getUsersAndPermissions, updateUserPermissions } from '$lib/server/db/models/userPermissions';
import { hashPassword } from '$lib/utils';

//for getting all users
export const GET: RequestHandler = async function GET({ request }) {
    try {
        //get all addons
        let allusers = await getUsersAndPermissions();

        return json({
            users: allusers,
        });
    } catch (error) {
        if (error instanceof Error) {
            return json({ error: error.message }, { status: 500 });
        } else {
            return json({ error: "Unknown error occurred" }, { status: 500 });
        }
    }
}

//create new user
export const POST: RequestHandler = async function POST({ request }) {
    try {
        let user: UserWithPermissions = await request.json();

        //hash the password they gave us
        user.hashedPassword = hashPassword(user.hashedPassword);

        //update user by itself first
        let newUser = await createNewUser(user);

        //update the permissions as well
        await updateUserPermissions(newUser.id, user);

        return json({});
    } catch (error) {
        if (error instanceof Error) {
            return json({ error: error.message }, { status: 500 });
        } else {
            return json({ error: "Unknown error occurred" }, { status: 500 });
        }
    }
}

//for updating user
export const PATCH: RequestHandler = async function PATH({ request }) {
    try {
        let user: UserWithPermissions = await request.json();

        //update user by itself first
        await updateUser(user.id, user.email, user.name);

        //update the permissions as well
        await updateUserPermissions(user.id, user);

        return json({});
    } catch (error) {
        if (error instanceof Error) {
            return json({ error: error.message }, { status: 500 });
        } else {
            return json({ error: "Unknown error occurred" }, { status: 500 });
        }
    }
}

//for updating user
export const DELETE: RequestHandler = async function PATH({ request }) {
    try {
        let user: UserWithPermissions = await request.json();

        //update user by itself first
        await deleteUser(user.userId);

        return json({});
    } catch (error) {
        if (error instanceof Error) {
            return json({ error: error.message }, { status: 500 });
        } else {
            return json({ error: "Unknown error occurred" }, { status: 500 });
        }
    }
}