import type { UserWithPermissions } from '$lib/types';
import type { User } from 'lucia';
import type { Database } from 'sqlite3'

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			db: Database,
			user: User,
			userPermissions: UserWithPermissions,
			session: Session,
			urlBeforeLogin?: string
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
