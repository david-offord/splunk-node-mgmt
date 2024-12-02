// src/lib/server/db.js
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('data.db', (err) => {
    if (err) {
        throw err;
    }
});

export default db;