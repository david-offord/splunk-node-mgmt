import { DATABASE_LOCATION } from '$env/static/private';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

const sqlite = new Database(DATABASE_LOCATION);
const db = drizzle(sqlite);

export { db, sqlite };