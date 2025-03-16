import { getAnsiblePlaybooks } from '$lib/server/db/models/ansiblePlaybooks';
import { getAllLogsForJob, getJob, getJobsAndLogs } from '$lib/server/db/models/jobs';
import type { AnsiblePlaybookModel, JobsModel } from '$lib/types';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ params, locals, parent }) => {

    //get job id
    let jobId = parseInt(params.jobId);

    //get job id
    let job = await getJob(jobId);

    //get all logs from job
    let jobLogs = await getAllLogsForJob(jobId);


    return {
        parent: await parent(),
        job: job,
        jobLogs: jobLogs
    }
};

