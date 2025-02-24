import type { PageServerLoad } from './$types';
import { getServerClassPageLoadData } from './serverClassFunctions';

export const load: PageServerLoad = async ({ locals }) => {
    let returnObject = await getServerClassPageLoadData()

    return returnObject;
};

