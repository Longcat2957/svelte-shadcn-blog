import {
    pgTable,
    serial,
    text,
    boolean,
    integer,
    timestamp,
    index,
    uniqueIndex,
    foreignKey
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Users Table - 관리자 및 사용자 인증
export const user = pgTable('user', {
    id: serial('id').primaryKey(),
    username: text('username').notNull().unique(), // 로그인 ID
    password: text('password').notNull(), // 해시된 비밀번호
    avatar_url: text('avatar_url'), // 사용자(관리자) 아바타 이미지 URL
    created_at: timestamp('created_at').defaultNow().notNull()
});

// Categories Table - 계층형 카테고리 구조
export const category = pgTable(
    'category',
    {
        id: serial('id').primaryKey(),
        name: text('name').notNull(),
        // 같은 parent_id 그룹 내에서 정렬 순서를 제어한다.
        sort_order: integer('sort_order').default(0).notNull(),
        parent_id: integer('parent_id').references((): any => category.id, { onDelete: 'cascade' }),
        created_at: timestamp('created_at').defaultNow().notNull()
    },
    (table) => {
        return {
            parentSortIdx: index('category_parent_sort_idx').on(
                table.parent_id,
                table.sort_order,
                table.id
            )
        };
    }
);

// Posts Table - 블로그 포스트 데이터
export const post = pgTable(
    'post',
    {
        id: serial('id').primaryKey(),
        title: text('title').notNull(),
        description: text('description'), // 목록 노출용 요약

        // 마크다운 문법의 경우 상당히 많은 양의 데이터가 포함될 가능성이 있음 -> text 타입 사용
        content: text('content').notNull(),

        // 카테고리 테이블 연동
        category_id: integer('category_id')
            .references(() => category.id)
            .notNull(),

        // Postgres의 Array 타입을 활용하여 별도 테이블 조인 없이 태그 관리
        tags: text('tags').array().notNull(),

        published: boolean('published').default(false).notNull(),
        views: integer('views').default(0).notNull(),

        created_at: timestamp('created_at').defaultNow().notNull(),
        updated_at: timestamp('updated_at')
            .defaultNow()
            .notNull()
            .$onUpdate(() => new Date())
    },
    (table) => {
        return {
            // 인덱싱을 활용하여 DB 쿼리의 속도를 높임
            publishedIdx: index('published_idx').on(table.published),
            createdIdx: index('created_idx').on(table.created_at),
            categoryIdIdx: index('category_id_idx').on(table.category_id),
            // 태그 검색 최적화를 위한 GIN Index
            tagsIdx: index('tags_idx').using('gin', table.tags)
        };
    }
);

// Comments Table - (Optional) 댓글 기능
export const comment = pgTable('comment', {
    id: serial('id').primaryKey(),
    post_id: integer('post_id')
        .references(() => post.id, { onDelete: 'cascade' })
        .notNull(),
    parent_id: integer('parent_id').references((): any => comment.id, { onDelete: 'cascade' }),
    author_name: text('author_name').notNull(),
    password: text('password'),
    is_secret: boolean('is_secret').default(false).notNull(),
    content: text('content').notNull(),
    created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations 정의
export const categoryRelations = relations(category, ({ one, many }) => ({
    parent: one(category, {
        fields: [category.parent_id],
        references: [category.id],
        relationName: 'category_hierarchy'
    }),
    children: many(category, {
        relationName: 'category_hierarchy'
    }),
    posts: many(post)
}));

export const postRelations = relations(post, ({ many, one }) => ({
    category: one(category, {
        fields: [post.category_id],
        references: [category.id]
    }),
    comments: many(comment)
}));

export const commentRelations = relations(comment, ({ one, many }) => ({
    post: one(post, {
        fields: [comment.post_id],
        references: [post.id]
    }),
    parent: one(comment, {
        fields: [comment.parent_id],
        references: [comment.id],
        relationName: 'comment_replies'
    }),
    replies: many(comment, {
        relationName: 'comment_replies'
    })
}));
