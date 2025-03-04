import { fail, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { AnsiblePlaybookModelVariables, AnsiblePlaybookModel } from '$lib/types';
import { getSingleAnsiblePlaybook } from '$lib/server/db/models/ansiblePlaybooks';
import { callAnsiblePlaybook } from '$lib/managementFunctions/ansibleManagementFunctions';
import { addJobLog, completeJob, createJob } from '$lib/server/db/models/jobs';
import { isNullOrUndefined } from '$lib/utils';

export const POST: RequestHandler = async function GET({ request, url, locals }) {
    //get playbook from call
    let apiPlaybook: AnsiblePlaybookModelVariables = await request.json();

    if (isNullOrUndefined(apiPlaybook.hosts) || apiPlaybook.hosts.length == 0) {
        return json('No hosts provided', { status: 400 });
    }

    //try to get playbook from db
    let dbPlaybook = await getSingleAnsiblePlaybook(apiPlaybook.id) as AnsiblePlaybookModel;

    //if not found, fail
    if (dbPlaybook === null) {
        return json('Playbook not found', { status: 404 });
    }

    //create a job, and add a log saying we started
    let jobId = await createJob("Running playbook " + apiPlaybook.playbookName, locals.user.id);
    await addJobLog(jobId, "Starting playbook run", 0);

    //call the playbook
    await callAnsiblePlaybook(jobId, dbPlaybook, apiPlaybook.hosts, apiPlaybook.variables);

    //mark job as completed after playbook run
    await completeJob(jobId);

    return json(dbPlaybook)
}
