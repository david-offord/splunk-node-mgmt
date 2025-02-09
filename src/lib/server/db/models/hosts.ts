import { db } from '$lib/server/db/client';
import { hosts, users } from '$lib/server/db/schema';
import type { Host } from '$lib/types';
import { like, asc, SQL, getTableColumns, count } from 'drizzle-orm';

const getHosts = async (searchParam: string = '', page: number = 0, pageSize: number = 10, orderBy: string = 'hostname') => {
    let orderByOperator: SQL = null;
    switch (orderBy) {
        case 'hostname':
            orderByOperator = asc(hosts.hostname)
        case 'customerCode':
            orderByOperator = asc(hosts.customerCode)
    }

    let allRows = await db.select({
        ...getTableColumns(hosts),
    })
        .from(hosts)
        .where(like(hosts.hostname, `%${searchParam}%`))
        .orderBy(orderByOperator)
        .limit(pageSize)
        .offset(page * pageSize);

    let rowCount = await db.select({
        count: count()
    })
        .from(hosts)
        .where(like(hosts.hostname, `%${searchParam}%`))

    return {
        rows: allRows,
        totalRows: rowCount[0].count
    };

};

const insertHost = async (host: Host) => {
    await db.insert(hosts).values(host as any);
}


export { getHosts, insertHost };