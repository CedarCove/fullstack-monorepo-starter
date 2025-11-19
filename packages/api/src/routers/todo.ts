import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { todos, eq, desc, and, sql } from '@grasp/database';
import type { TodoWithMetadata } from '@grasp/database';

/**
 * Todo router with complex business logic
 * Now uses Drizzle ORM for type-safe database queries
 */
export const todoRouter = router({
  /**
   * Get all todos for the authenticated user
   * This includes computed fields and aggregations
   */
  list: protectedProcedure.query(async ({ ctx }): Promise<TodoWithMetadata[]> => {
    try {
      const userTodos = await ctx.db
        .select()
        .from(todos)
        .where(eq(todos.userId, ctx.user.id))
        .orderBy(desc(todos.createdAt));

      // Add computed fields - this is where tRPC adds value
      const todosWithMetadata: TodoWithMetadata[] = userTodos.map((todo) => ({
        ...todo,
        isOverdue: todo.completed
          ? false
          : new Date(todo.createdAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        daysOld: Math.floor(
          (Date.now() - new Date(todo.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        ),
      }));

      return todosWithMetadata;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch todos',
      });
    }
  }),

  /**
   * Get a single todo by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const [todo] = await ctx.db
          .select()
          .from(todos)
          .where(and(eq(todos.id, input.id), eq(todos.userId, ctx.user.id)))
          .limit(1);

        if (!todo) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Todo not found',
          });
        }

        return todo;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch todo',
        });
      }
    }),

  /**
   * Create a new todo
   * Validates input and applies business logic
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [newTodo] = await ctx.db
          .insert(todos)
          .values({
            title: input.title,
            description: input.description,
            userId: ctx.user.id,
            completed: false,
          })
          .returning();

        if (!newTodo) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create todo',
          });
        }

        return newTodo;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create todo',
        });
      }
    }),

  /**
   * Update a todo
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional().nullable(),
        completed: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      try {
        // First verify ownership
        const [existing] = await ctx.db
          .select({ id: todos.id })
          .from(todos)
          .where(and(eq(todos.id, id), eq(todos.userId, ctx.user.id)))
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Todo not found',
          });
        }

        const [updatedTodo] = await ctx.db
          .update(todos)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(todos.id, id))
          .returning();

        if (!updatedTodo) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update todo',
          });
        }

        return updatedTodo;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update todo',
        });
      }
    }),

  /**
   * Delete a todo
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
          .delete(todos)
          .where(and(eq(todos.id, input.id), eq(todos.userId, ctx.user.id)))
          .returning({ id: todos.id });

        if (result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Todo not found',
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete todo',
        });
      }
    }),

  /**
   * Get statistics about user's todos
   * Complex business logic that aggregates data using Drizzle
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const [stats] = await ctx.db
        .select({
          total: sql<number>`count(*)::int`,
          completed: sql<number>`count(*) filter (where ${todos.completed} = true)::int`,
        })
        .from(todos)
        .where(eq(todos.userId, ctx.user.id));

      const total = stats?.total || 0;
      const completed = stats?.completed || 0;
      const pending = total - completed;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        total,
        completed,
        pending,
        completionRate: Math.round(completionRate * 100) / 100,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch stats',
      });
    }
  }),

  /**
   * Public endpoint to get total todos count (demo of public procedure)
   */
  getTotalCount: publicProcedure.query(async ({ ctx }) => {
    try {
      const [result] = await ctx.db.select({ count: sql<number>`count(*)::int` }).from(todos);

      return { count: result?.count || 0 };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch count',
      });
    }
  }),
});
