import { getAnsiblePlaybooks } from '$lib/server/db/models/ansiblePlaybooks';
import type { AnsiblePlaybookModel } from '$lib/types';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ locals }) => {
    let playbooks = await getAnsiblePlaybooks() as AnsiblePlaybookModel[];

    return {
        playbooks: playbooks
    }
};

