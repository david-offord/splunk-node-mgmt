import { db } from '$lib/server/db/client';
import { jobs, jobLogs } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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
        let test = await db.insert(jobLogs)
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
    createJob,
    addJobLog,
    completeJob
}