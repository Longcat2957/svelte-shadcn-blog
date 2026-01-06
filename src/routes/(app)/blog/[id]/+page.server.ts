import { posts } from '$lib/mock/posts';
import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { comment } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ params }) => {
    const post = posts.find((p) => p.id === params.id);

    if (!post) {
        throw error(404, 'Post not found');
    }

    return {
        post
    };
};

export const actions: Actions = {
    createComment: async ({ request, params }) => {
        const formData = await request.formData();
        const author_name = formData.get('author_name') as string;
        const content = formData.get('content') as string;
        const parentId = formData.get('parentId');

        if (!author_name || !content) {
            return { success: false };
        }

        // post_id numeric conversion (params.id might be string '1', '2' etc)
        const post_id = parseInt(params.id ?? '0');

        await db.insert(comment).values({
            post_id,
            author_name,
            content,
            parent_id: parentId ? parseInt(parentId as string) : null
        });

        return { success: true };
    }
};
