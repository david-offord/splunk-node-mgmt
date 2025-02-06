import { dev } from '$app/environment';
import { db } from '$lib/server/db/client';
import { LibSQLAdapter } from '@lucia-auth/adapter-sqlite';
import { Lucia } from 'lucia';

interface DatabaseUserAttributes {
    email: string;
}

interface DatabaseSessionAttributes {
    created_at: Date;
    updated_at: Date;
}

const adapter = new LibSQLAdapter(db, {
    user: 'users',
    session: 'sessions'
});

const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            secure: !dev
        }
    },
    getUserAttributes: (attributes) => {
        return {
            email: attributes.email
        };
    },
    getSessionAttributes: (attributes) => {
        return {
            created_at: attributes.created_at,
            updated_at: attributes.updated_at
        };
    }
});

declare module 'lucia' {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: DatabaseUserAttributes;
        DatabaseSessionAttributes: DatabaseSessionAttributes;
    }
}

export { lucia };