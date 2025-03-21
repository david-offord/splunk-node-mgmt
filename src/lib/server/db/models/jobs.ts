import { db } from '$lib/server/db/client';
import { jobs, jobLogs, users } from '$lib/server/db/schema';
import type { JobsModel } from '$lib/types';
import { eq, gt, isNotNull, and, getTableColumns, desc, asc } from 'drizzle-orm';

const getAllJobs = async (lastTimestamp: Date = null) => {
    if (lastTimestamp === null) {
        lastTimestamp = new Date();
        lastTimestamp.setDate(lastTimestamp.getDate() - 5);
        lastTimestamp = new Date(lastTimestamp);
    }

    let allLogs = await db.select({
        ...getTableColumns(jobs),
        startedBy: users.name
    })
        .from(jobs)
        .where(gt(jobs.updatedOn, lastTimestamp))
        .innerJoin(users, eq(jobs.startedBy, users.id))
        .orderBy(desc(jobs.updatedOn));

    return allLogs;
}

const getJob = async (jobId: number) => {
    let allLogs = await db.select({
        ...getTableColumns(jobs),
        startedByName: users.name
    })
        .from(jobs)
        .leftJoin(users, eq(jobs.startedBy, users.id))
        .where(eq(jobs.id, jobId));

    if (allLogs.length > 0)
        return allLogs[0];
    return null;
}



const getAllLogsForJob = async (jobId: number) => {
    let allLogs = await db.select({
        ...getTableColumns(jobLogs)
    })
        .from(jobLogs)
        .orderBy(asc(jobLogs.createdOn))
        .where(eq(jobLogs.jobId, jobId));

    return allLogs;
}


const getJobsAndLogs = async (lastTimestamp: Date = null, specificLog: number = undefined) => {
    if (lastTimestamp === null) {
        lastTimestamp = new Date();
        lastTimestamp.setDate(lastTimestamp.getDate() - 5);
        lastTimestamp = new Date(lastTimestamp);
    }

    let allLogs = await db.select({
        job: jobs,
        log: jobLogs
    })
        .from(jobs)
        .where(and(gt(jobs.updatedOn, lastTimestamp), specificLog || specificLog === 0 ? eq(jobs.id, specificLog) : isNotNull(jobs.id)))
        .innerJoin(jobLogs, eq(jobs.id, jobLogs.jobId));

    //reduce the job and logs down into 1 job -> Many logs
    const result = allLogs.reduce<Record<number, { job: JobsModel; log: any[] }>>(
        (acc, row) => {
            const job = row.job;
            const log = row.log;

            if (!acc[job.id]) {
                acc[job.id] = { job, log: [] };
            }

            if (log) {
                acc[job.id].log.push(log);
            }
            return acc;
        },
        {}
    );

    return result;

}

const createJob = async (description: string, startedBy: string) => {
    let newlog = await db.insert(jobs)
        .values({
            jobDescription: description,
            startedBy: startedBy,
            createdOn: Date.now(),
            completed: false
        } as any)
        .returning();

    if (newlog.length > 0)
        return newlog[0].id;
    return -1;
}

const addJobLog = async (jobId: number, message: string, logLevel: number = 0) => {
    try {
        await db.insert(jobLogs)
            .values({
                jobId: jobId,
                log: message,
                logLevel: logLevel
            } as any)
            .returning();

    }
    catch {
        //do nothing. I dont want to break logging.
    }
}

const completeJob = async (jobId: number) => {
    try {
        await db.update(jobs)
            .set({
                completed: 1,
                completedOn: new Date()
            } as any)
            .where(eq(jobs.id, jobId));
    }
    catch {
        //do nothing. I dont want to break logging.
    }
}


export {
    getAllJobs,
    getJob,
    getAllLogsForJob,
    getJobsAndLogs,
    createJob,
    addJobLog,
    completeJob
}