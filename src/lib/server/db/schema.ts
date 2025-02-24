import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { generateId } from 'lucia';

const timestamp = {
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date())
};

const users = sqliteTable('users', {
    ...timestamp,
    id: text('id')
        .primaryKey()
        .notNull()
        .$defaultFn(() => generateId(15)),
    name: text('name').notNull().default("Not Found"),
    email: text('email').unique().notNull(),
    hashedPassword: text('hashed_password').notNull()
});

const sessions = sqliteTable('sessions', {
    ...timestamp,
    id: text('id')
        .primaryKey()
        .notNull()
        .$defaultFn(() => generateId(15)),
    expiresAt: integer('expires_at').notNull(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id)
});


export const hosts = sqliteTable("hosts", {
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    hostname: text().notNull(),
    ipAddress: text().notNull(),
    customerCode: text().notNull(),
    ansibleName: text(),
    linuxUsername: text(),
    splunkHomePath: text(),
    splunkRestartCommand: text(),
    splunkManagementPort: text(),
});

export const serverClasses = sqliteTable("ServerClasses", {
    id: integer().primaryKey({ autoIncrement: true }),
    name: text(),
});

export const serverClassByHost = sqliteTable("serverClassByHost", {
    id: integer().primaryKey({ autoIncrement: true }),
    serverClassId: integer(),
    hostId: integer(),
});

export const addons = sqliteTable("addons", {
    id: integer().primaryKey({ autoIncrement: true }),
    displayName: text().notNull(),
    addonFileLocation: text().notNull(),
    addonIgnoreFileOption: text(),
    actionOnInstallation: text(),
    addonFolderName: text(),
});

export const serverClassByAddon = sqliteTable("serverClassByAddon", {
    id: integer().primaryKey({ autoIncrement: true }),
    serverClassId: integer(),
    addonId: integer(),
});


export const ansiblePlaybooks = sqliteTable("ansiblePlaybooks", {
    id: integer().primaryKey({ autoIncrement: true }),
    playbookName: text().notNull(),
    playbookNotes: text().notNull(),
    playbookContents: text().notNull(),
    createdBy: text().notNull().references(() => users.id),
    ...timestamp,


});




export { sessions, users };