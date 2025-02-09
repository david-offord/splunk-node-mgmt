import { fail, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async function GET({ request, url }) {
    return json({
    });
}


