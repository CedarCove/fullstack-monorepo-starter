import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { categories, posts, postCategories, eq, and, sql } from '@repo/database';

/**
 * Category router
 * Demonstrates simple CRUD operations and aggregations
 */
export const categoryRouter = router({
  /**
   * List all categories with post counts
   * Public endpoint
   */
  list: publicProcedure.query(async ({ ctx }) => {
    try {
      const allCategories = await ctx.db.select().from(categories);

      // Get post count for each category
      const categoriesWithCounts = await Promise.all(
        allCategories.map(async (category) => {
          const [countResult] = await ctx.db
            .select({ count: sql<number>`count(*)::int` })
            .from(postCategories)
            .innerJoin(posts, eq(postCategories.postId, posts.id))
            .where(and(eq(postCategories.categoryId, category.id), eq(posts.status, 'published')));

          return {
            ...category,
            postCount: countResult?.count || 0,
          };
        })
      );

      // Sort by post count descending
      return categoriesWithCounts.sort((a, b) => b.postCount - a.postCount);
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch categories',
      });
    }
  }),

  /**
   * Get a single category by slug
   * Public endpoint
   */
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    try {
      const [category] = await ctx.db
        .select()
        .from(categories)
        .where(eq(categories.slug, input.slug))
        .limit(1);

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        });
      }

      // Get post count
      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(postCategories)
        .innerJoin(posts, eq(postCategories.postId, posts.id))
        .where(and(eq(postCategories.categoryId, category.id), eq(posts.status, 'published')));

      return {
        ...category,
        postCount: countResult?.count || 0,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch category',
      });
    }
  }),

  /**
   * Create a new category
   * Protected endpoint - requires authentication
   * In a real app, you might want to restrict this to admins only
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z
          .string()
          .min(1)
          .max(100)
          .regex(/^[a-z0-9-]+$/),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if slug is unique
        const [existing] = await ctx.db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.slug, input.slug))
          .limit(1);

        if (existing) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Category slug already exists',
          });
        }

        const [newCategory] = await ctx.db.insert(categories).values(input).returning();

        if (!newCategory) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create category',
          });
        }

        return newCategory;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create category',
        });
      }
    }),

  /**
   * Update a category
   * Protected endpoint
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        slug: z
          .string()
          .min(1)
          .max(100)
          .regex(/^[a-z0-9-]+$/)
          .optional(),
        description: z.string().max(500).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      try {
        // Verify category exists
        const [existing] = await ctx.db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.id, id))
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Category not found',
          });
        }

        // Check slug uniqueness if updating slug
        if (input.slug) {
          const [slugExists] = await ctx.db
            .select({ id: categories.id })
            .from(categories)
            .where(and(eq(categories.slug, input.slug), sql`${categories.id} != ${id}`))
            .limit(1);

          if (slugExists) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Category slug already exists',
            });
          }
        }

        const [updatedCategory] = await ctx.db
          .update(categories)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(categories.id, id))
          .returning();

        return updatedCategory;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update category',
        });
      }
    }),

  /**
   * Delete a category
   * Protected endpoint
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if category exists
        const [existing] = await ctx.db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.id, input.id))
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Category not found',
          });
        }

        // Check if category has posts
        const [hasPostsResult] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(postCategories)
          .where(eq(postCategories.categoryId, input.id));

        if (hasPostsResult && hasPostsResult.count > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot delete category with existing posts',
          });
        }

        await ctx.db.delete(categories).where(eq(categories.id, input.id));

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete category',
        });
      }
    }),
});
