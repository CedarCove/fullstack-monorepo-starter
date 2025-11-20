import {
  pgTable,
  text,
  uuid,
  boolean,
  timestamp,
  pgEnum,
  integer,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Post status enum
 */
export const postStatusEnum = pgEnum('post_status', ['draft', 'published', 'archived']);

/**
 * User role enum
 */
export const userRoleEnum = pgEnum('user_role', ['user', 'moderator', 'admin']);

// ============================================================================
// TABLES
// ============================================================================

/**
 * Profiles Table
 * Stores user profile information
 * Note: User authentication is handled by Supabase Auth
 * This table stores additional profile data
 */
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().notNull(),
    username: text('username').notNull().unique(),
    fullName: text('full_name'),
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    role: userRoleEnum('role').default('user').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    usernameIdx: index('profiles_username_idx').on(table.username),
  })
);

/**
 * Posts Table
 * Stores blog posts or articles
 * Example of one-to-many relationship with profiles
 */
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    content: text('content').notNull(),
    excerpt: text('excerpt'),
    coverImage: text('cover_image'),
    status: postStatusEnum('status').default('draft').notNull(),
    viewCount: integer('view_count').default(0).notNull(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index('posts_slug_idx').on(table.slug),
    authorIdx: index('posts_author_idx').on(table.authorId),
    statusIdx: index('posts_status_idx').on(table.status),
    publishedAtIdx: index('posts_published_at_idx').on(table.publishedAt),
  })
);

/**
 * Comments Table
 * Stores comments on posts
 * Example of nested one-to-many relationships (posts -> comments, comments -> replies)
 */
// @ts-ignore - Self-referencing table causes circular type issues
export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    content: text('content').notNull(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    // @ts-ignore - Self-referencing foreign key
    parentId: uuid('parent_id').references(() => comments.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    postIdx: index('comments_post_idx').on(table.postId),
    authorIdx: index('comments_author_idx').on(table.authorId),
    parentIdx: index('comments_parent_idx').on(table.parentId),
  })
);

/**
 * Categories Table
 * Stores post categories/tags
 * Example of many-to-many relationship with posts
 */
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index('categories_slug_idx').on(table.slug),
  })
);

/**
 * Post Categories Junction Table
 * Many-to-many relationship between posts and categories
 */
export const postCategories = pgTable(
  'post_categories',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.categoryId] }),
    postIdx: index('post_categories_post_idx').on(table.postId),
    categoryIdx: index('post_categories_category_idx').on(table.categoryId),
  })
);

/**
 * Todos Table
 * Stores todo items for users
 * Example of simple one-to-many relationship
 */
export const todos = pgTable(
  'todos',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    title: text('title').notNull(),
    description: text('description'),
    completed: boolean('completed').default(false).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('todos_user_idx').on(table.userId),
    completedIdx: index('todos_completed_idx').on(table.completed),
  })
);

// ============================================================================
// RELATIONS
// ============================================================================

export const profilesRelations = relations(profiles, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  todos: many(todos),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(profiles, {
    fields: [posts.authorId],
    references: [profiles.id],
  }),
  comments: many(comments),
  postCategories: many(postCategories),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(profiles, {
    fields: [comments.authorId],
    references: [profiles.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'commentReplies',
  }),
  replies: many(comments, {
    relationName: 'commentReplies',
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  postCategories: many(postCategories),
}));

export const postCategoriesRelations = relations(postCategories, ({ one }) => ({
  post: one(posts, {
    fields: [postCategories.postId],
    references: [posts.id],
  }),
  category: one(categories, {
    fields: [postCategories.categoryId],
    references: [categories.id],
  }),
}));

export const todosRelations = relations(todos, ({ one }) => ({
  user: one(profiles, {
    fields: [todos.userId],
    references: [profiles.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Profile types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type UpdateProfile = Partial<InsertProfile>;

// Post types
export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;
export type UpdatePost = Partial<InsertPost>;

// Comment types
export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;
export type UpdateComment = Partial<InsertComment>;

// Category types
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type UpdateCategory = Partial<InsertCategory>;

// Post Category types
export type PostCategory = typeof postCategories.$inferSelect;
export type InsertPostCategory = typeof postCategories.$inferInsert;

// Todo types
export type Todo = typeof todos.$inferSelect;
export type InsertTodo = typeof todos.$inferInsert;
export type UpdateTodo = Partial<InsertTodo>;

/**
 * Todo with computed metadata fields
 */
export type TodoWithMetadata = Todo & {
  isOverdue: boolean;
  daysOld: number;
};

// ============================================================================
// EXTENDED TYPES WITH RELATIONS
// ============================================================================

/**
 * Post with author and categories
 */
export type PostWithDetails = Post & {
  author: Profile;
  categories: Category[];
  commentCount?: number;
};

/**
 * Comment with author and replies
 */
export type CommentWithDetails = Comment & {
  author: Profile;
  replies?: CommentWithDetails[];
};

/**
 * Profile with post count
 */
export type ProfileWithStats = Profile & {
  postCount: number;
  commentCount: number;
};
