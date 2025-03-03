import { fail, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { AnsiblePlaybookModelVariables, AnsiblePlaybookModel } from '$lib/types';
import { getSingleAnsiblePlaybook } from '$lib/server/db/models/ansiblePlaybooks';
import { callAnsiblePlaybook } from '$lib/managementFunctions/ansibleManagementFunctions';

export const POST: RequestHandler = async function GET({ request, url, locals }) {
    //get playbook from call
    let apiPlaybook: AnsiblePlaybookModelVariables = await request.json();

    //try to get playbook from db
    let dbPlaybook = await getSingleAnsiblePlaybook(apiPlaybook.id) as AnsiblePlaybookModel;

    //if not found, fail
    if (dbPlaybook === null) {
        return json('Playbook not found', { status: 404 });
    }

    await callAnsiblePlaybook(dbPlaybook, apiPlaybook.hosts, apiPlaybook.variables);

    return json(dbPlaybook)

}
