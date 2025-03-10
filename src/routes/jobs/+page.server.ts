import { getAnsiblePlaybooks } from '$lib/server/db/models/ansiblePlaybooks';
import { getAllJobs } from '$lib/server/db/models/jobs';
import type { AnsiblePlaybookModel, JobsModel } from '$lib/types';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ locals }) => {
    let allJobs = (await getAllJobs()) as JobsModel[];


    return {
        jobs: allJobs
    }
};

