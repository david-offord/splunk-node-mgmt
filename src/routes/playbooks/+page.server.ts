import { getAnsiblePlaybooks } from '$lib/server/db/models/ansiblePlaybooks';
import { addJobLog, completeJob, createJob, getAllJobs } from '$lib/server/db/models/jobs';
import type { AnsiblePlaybookModel } from '$lib/types';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ locals, parent }) => {
    let playbooks = await getAnsiblePlaybooks() as AnsiblePlaybookModel[];


    return {
        parent: await parent(),
        playbooks: playbooks
    }
};

