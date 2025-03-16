import { getAnsiblePlaybooks, getSingleAnsiblePlaybook } from '$lib/server/db/models/ansiblePlaybooks';
import { getHosts } from '$lib/server/db/models/hosts';
import type { AnsiblePlaybookModel } from '$lib/types';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ params, parent }) => {

    //get the playbook name first
    let playbookId = parseInt(params.playbook);

    //get the playbook
    let playbook = await getSingleAnsiblePlaybook(playbookId) as AnsiblePlaybookModel;

    let allHosts = await getHosts();

    return {
        parent: await parent(),
        playbook: playbook,
        hosts: allHosts.rows
    }
};

