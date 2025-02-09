// src/lib/server/db.js
import sqlite3 from 'sqlite3';
import { DATABASE_LOCATION } from '$env/static/private';

const db = new sqlite3.Database(DATABASE_LOCATION, (err) => {
    if (err) {
        throw err;
    }
});

export default db;