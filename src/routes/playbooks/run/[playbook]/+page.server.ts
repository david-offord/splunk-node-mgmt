import { getAnsiblePlaybooks, getSingleAnsiblePlaybook } from '$lib/server/db/models/ansiblePlaybooks';
import { addJobLog, completeJob, createJob, getAllJobs } from '$lib/server/db/models/jobs';
import type { AnsiblePlaybookModel } from '$lib/types';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ params }) => {

    //get the playbook name first
    let playbookId = parseInt(params.playbook);

    //get the playbook
    let playbook = await getSingleAnsiblePlaybook(playbookId) as AnsiblePlaybookModel;


    return {
        playbook: playbook
    }
};

