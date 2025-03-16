import { fail, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { AnsiblePlaybookModel } from '$lib/types';
import { createAnsiblePlaybook, deleteAnsiblePlaybook, getAnsiblePlaybooks, getSingleAnsiblePlaybook, updateAnsiblePlaybook } from '$lib/server/db/models/ansiblePlaybooks';
import { createJob } from '$lib/server/db/models/jobs';
import { canUserAccessApi } from '$lib/utils';

export const GET: RequestHandler = async function GET({ request, url, locals }) {
    let canAccess = canUserAccessApi(locals.userPermissions, url.pathname, request.method);
    if (!canAccess) {
        return json({ error: "You do not have permission to access this API" }, { status: 403 });
    }

    let playbooks = await getAnsiblePlaybooks() as AnsiblePlaybookModel[];

    return json({
        playbooks: playbooks
    });
}

export const POST: RequestHandler = async function GET({ request, url, locals }) {
    let canAccess = canUserAccessApi(locals.userPermissions, url.pathname, request.method);
    if (!canAccess) {
        return json({ error: "You do not have permission to access this API" }, { status: 403 });
    }

    let playbook: AnsiblePlaybookModel = await request.json();

    //try to get an existing playbook that matches this
    let existingAnsiblePlaybook = await getSingleAnsiblePlaybook(playbook.id);

    //if there was one, error out
    if (existingAnsiblePlaybook !== null) {
        return json({
            "errorMessage": "A playbook already exists with this ID."
        }, {
            status: 400
        });
    }

    //save the current user
    playbook.createdBy = locals.user.id;
    delete playbook['id'];

    //then, try to update it
    let returnPlaybook = await createAnsiblePlaybook(playbook);

    return json({
        playbook: returnPlaybook
    });
}


export const PATCH: RequestHandler = async function GET({ request, url, locals }) {
    let canAccess = canUserAccessApi(locals.userPermissions, url.pathname, request.method);
    if (!canAccess) {
        return json({ error: "You do not have permission to access this API" }, { status: 403 });
    }

    let playbook: AnsiblePlaybookModel = await request.json();

    //try to get an existing playbook that matches this
    let existingAnsiblePlaybook = getSingleAnsiblePlaybook(playbook.id);

    //if there wasnt one, error out
    if (existingAnsiblePlaybook === null) {
        return json({
            "errorMessage": "No playbook with that ID exists."
        }, {
            status: 400
        });
    }

    //then, try to update it
    let returnPlaybook = updateAnsiblePlaybook(playbook);


    return json({
        playbook: returnPlaybook
    });
}


export const DELETE: RequestHandler = async function GET({ request, url, locals }) {
    let canAccess = canUserAccessApi(locals.userPermissions, url.pathname, request.method);
    if (!canAccess) {
        return json({ error: "You do not have permission to access this API" }, { status: 403 });
    }

    let playbook: AnsiblePlaybookModel = await request.json();

    //then, try to update it
    let returnPlaybook = deleteAnsiblePlaybook(playbook.id);


    return json({
        playbook: returnPlaybook
    });
}


