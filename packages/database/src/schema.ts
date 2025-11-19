import { pgTable, text, uuid, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Profiles Table
 * Stores user profile information
 */
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().notNull(),
  username: text('username').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Todos Table
 * Stores todo items for users
 */
export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  title: text('title').notNull(),
  description: text('description'),
  completed: boolean('completed').default(false).notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Relations
 */
export const profilesRelations = relations(profiles, ({ many }) => ({
  todos: many(todos),
}));

export const todosRelations = relations(todos, ({ one }) => ({
  user: one(profiles, {
    fields: [todos.userId],
    references: [profiles.id],
  }),
}));

/**
 * Type Exports
 */
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type UpdateProfile = Partial<InsertProfile>;

export type Todo = typeof todos.$inferSelect;
export type InsertTodo = typeof todos.$inferInsert;
export type UpdateTodo = Partial<InsertTodo>;

/**
 * Computed Todo type with additional fields
 */
export type TodoWithMetadata = Todo & {
  isOverdue: boolean;
  daysOld: number;
};
