import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	return {
		post: {
			test: 'hello'
		}
	};
};