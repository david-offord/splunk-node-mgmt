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
			session: Session,
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
