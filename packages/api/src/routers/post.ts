import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  posts,
  profiles,
  categories,
  postCategories,
  comments,
  eq,
  and,
  desc,
  sql,
  asc,
  like,
  or,
  inArray,
} from '@repo/database';
import type { PostWithDetails } from '@repo/database';

/**
 * Post router demonstrating complex relationships and queries
 * Shows:
 * - One-to-many relationships (author -> posts)
 * - Many-to-many relationships (posts <-> categories)
 * - Pagination
 * - Filtering and searching
 * - Aggregations
 */
export const postRouter = router({
  /**
   * List posts with pagination and filtering
   * Public endpoint - anyone can view published posts
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
        status: z.enum(['draft', 'published', 'archived']).optional(),
        categorySlug: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Build where conditions
        const conditions = [];

        // Filter by status (default to published for public)
        if (input.status) {
          conditions.push(eq(posts.status, input.status));
        } else {
          conditions.push(eq(posts.status, 'published'));
        }

        // Search in title and content
        if (input.search) {
          conditions.push(
            or(like(posts.title, `%${input.search}%`), like(posts.content, `%${input.search}%`))
          );
        }

        // Filter by category
        let categoryFilter;
        if (input.categorySlug) {
          const [category] = await ctx.db
            .select({ id: categories.id })
            .from(categories)
            .where(eq(categories.slug, input.categorySlug))
            .limit(1);

          if (category) {
            categoryFilter = category.id;
          }
        }

        // Build query with conditional joins
        const baseQuery = ctx.db
          .select({
            id: posts.id,
            title: posts.title,
            slug: posts.slug,
            content: posts.content,
            excerpt: posts.excerpt,
            coverImage: posts.coverImage,
            status: posts.status,
            viewCount: posts.viewCount,
            publishedAt: posts.publishedAt,
            createdAt: posts.createdAt,
            updatedAt: posts.updatedAt,
            authorId: posts.authorId,
            author: {
              id: profiles.id,
              username: profiles.username,
              fullName: profiles.fullName,
              avatarUrl: profiles.avatarUrl,
            },
          })
          .from(posts)
          .leftJoin(profiles, eq(posts.authorId, profiles.id));

        // Add category join if filtering by category
        const queryWithJoins = categoryFilter
          ? baseQuery.innerJoin(postCategories, eq(posts.id, postCategories.postId))
          : baseQuery;

        // Add where conditions
        const allConditions = categoryFilter
          ? [...conditions, eq(postCategories.categoryId, categoryFilter)]
          : conditions;

        const result = await queryWithJoins
          .where(and(...allConditions))
          .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        // Get categories for each post
        const postsWithDetails = await Promise.all(
          result.map(async (post) => {
            const postCats = await ctx.db
              .select({
                id: categories.id,
                name: categories.name,
                slug: categories.slug,
                description: categories.description,
              })
              .from(postCategories)
              .innerJoin(categories, eq(postCategories.categoryId, categories.id))
              .where(eq(postCategories.postId, post.id));

            // Get comment count
            const [commentCountResult] = await ctx.db
              .select({ count: sql<number>`count(*)::int` })
              .from(comments)
              .where(eq(comments.postId, post.id));

            return {
              ...post,
              author: post.author!,
              categories: postCats,
              commentCount: commentCountResult?.count || 0,
            };
          })
        );

        // Get total count for pagination
        const [totalResult] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(posts)
          .where(and(...conditions));

        return {
          posts: postsWithDetails,
          total: totalResult?.count || 0,
          hasMore: input.offset + input.limit < (totalResult?.count || 0),
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch posts',
        });
      }
    }),

  /**
   * Get a single post by slug
   * Public endpoint
   */
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    try {
      const [post] = await ctx.db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          content: posts.content,
          excerpt: posts.excerpt,
          coverImage: posts.coverImage,
          status: posts.status,
          viewCount: posts.viewCount,
          publishedAt: posts.publishedAt,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          authorId: posts.authorId,
          author: {
            id: profiles.id,
            username: profiles.username,
            fullName: profiles.fullName,
            avatarUrl: profiles.avatarUrl,
            bio: profiles.bio,
          },
        })
        .from(posts)
        .leftJoin(profiles, eq(posts.authorId, profiles.id))
        .where(eq(posts.slug, input.slug))
        .limit(1);

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      // Only show published posts to non-authors
      if (post.status !== 'published' && (!ctx.user || ctx.user.id !== post.authorId)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Post not available',
        });
      }

      // Get categories
      const postCats = await ctx.db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
        })
        .from(postCategories)
        .innerJoin(categories, eq(postCategories.categoryId, categories.id))
        .where(eq(postCategories.postId, post.id));

      // Get comment count
      const [commentCountResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(comments)
        .where(eq(comments.postId, post.id));

      // Increment view count
      await ctx.db
        .update(posts)
        .set({ viewCount: sql`${posts.viewCount} + 1` })
        .where(eq(posts.id, post.id));

      return {
        ...post,
        author: post.author!,
        categories: postCats,
        commentCount: commentCountResult?.count || 0,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch post',
      });
    }
  }),

  /**
   * Create a new post
   * Protected endpoint - only authenticated users
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        slug: z
          .string()
          .min(1)
          .max(200)
          .regex(/^[a-z0-9-]+$/),
        content: z.string().min(1),
        excerpt: z.string().max(500).optional(),
        coverImage: z.string().url().optional(),
        status: z.enum(['draft', 'published', 'archived']).default('draft'),
        categoryIds: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { categoryIds, ...postData } = input;

        // Check if slug is unique
        const [existing] = await ctx.db
          .select({ id: posts.id })
          .from(posts)
          .where(eq(posts.slug, input.slug))
          .limit(1);

        if (existing) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Slug already exists',
          });
        }

        // Create post
        const [newPost] = await ctx.db
          .insert(posts)
          .values({
            ...postData,
            authorId: ctx.user.id,
            publishedAt: input.status === 'published' ? new Date() : null,
          })
          .returning();

        if (!newPost) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create post',
          });
        }

        // Add categories if provided
        if (categoryIds && categoryIds.length > 0) {
          await ctx.db.insert(postCategories).values(
            categoryIds.map((categoryId) => ({
              postId: newPost.id,
              categoryId,
            }))
          );
        }

        return newPost;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create post',
        });
      }
    }),

  /**
   * Update a post
   * Protected endpoint - only post author can update
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        slug: z
          .string()
          .min(1)
          .max(200)
          .regex(/^[a-z0-9-]+$/)
          .optional(),
        content: z.string().min(1).optional(),
        excerpt: z.string().max(500).optional().nullable(),
        coverImage: z.string().url().optional().nullable(),
        status: z.enum(['draft', 'published', 'archived']).optional(),
        categoryIds: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, categoryIds, ...updates } = input;

      try {
        // Verify ownership
        const [existing] = await ctx.db
          .select({ authorId: posts.authorId, status: posts.status })
          .from(posts)
          .where(eq(posts.id, id))
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Post not found',
          });
        }

        if (existing.authorId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only update your own posts',
          });
        }

        // Check slug uniqueness if updating slug
        if (input.slug) {
          const [slugExists] = await ctx.db
            .select({ id: posts.id })
            .from(posts)
            .where(and(eq(posts.slug, input.slug), sql`${posts.id} != ${id}`))
            .limit(1);

          if (slugExists) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Slug already exists',
            });
          }
        }

        // Set publishedAt if changing from draft to published
        const publishedAt =
          input.status === 'published' && existing.status !== 'published' ? new Date() : undefined;

        // Update post
        const [updatedPost] = await ctx.db
          .update(posts)
          .set({
            ...updates,
            publishedAt,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, id))
          .returning();

        // Update categories if provided
        if (categoryIds !== undefined) {
          // Remove existing categories
          await ctx.db.delete(postCategories).where(eq(postCategories.postId, id));

          // Add new categories
          if (categoryIds.length > 0) {
            await ctx.db.insert(postCategories).values(
              categoryIds.map((categoryId) => ({
                postId: id,
                categoryId,
              }))
            );
          }
        }

        return updatedPost;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update post',
        });
      }
    }),

  /**
   * Delete a post
   * Protected endpoint - only post author can delete
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const [existing] = await ctx.db
          .select({ authorId: posts.authorId })
          .from(posts)
          .where(eq(posts.id, input.id))
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Post not found',
          });
        }

        if (existing.authorId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only delete your own posts',
          });
        }

        // Delete post (categories and comments will cascade)
        await ctx.db.delete(posts).where(eq(posts.id, input.id));

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete post',
        });
      }
    }),

  /**
   * Get posts by current user
   * Protected endpoint
   */
  myPosts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
        status: z.enum(['draft', 'published', 'archived']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const conditions = [eq(posts.authorId, ctx.user.id)];

        if (input.status) {
          conditions.push(eq(posts.status, input.status));
        }

        const result = await ctx.db
          .select()
          .from(posts)
          .where(and(...conditions))
          .orderBy(desc(posts.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        const [totalResult] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(posts)
          .where(and(...conditions));

        return {
          posts: result,
          total: totalResult?.count || 0,
          hasMore: input.offset + input.limit < (totalResult?.count || 0),
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch posts',
        });
      }
    }),
});
