import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { comments, profiles, posts, eq, and, desc, sql, isNull } from '@repo/database';
import type { CommentWithDetails } from '@repo/database';

/**
 * Comment router
 * Demonstrates nested relationships (comments -> replies)
 * and recursive data structures
 */
export const commentRouter = router({
  /**
   * Get comments for a post with nested replies
   * Public endpoint
   */
  getByPostId: publicProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        // First, verify the post exists
        const [post] = await ctx.db
          .select({ id: posts.id })
          .from(posts)
          .where(eq(posts.id, input.postId))
          .limit(1);

        if (!post) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Post not found',
          });
        }

        // Get all comments for the post
        const allComments = await ctx.db
          .select({
            id: comments.id,
            content: comments.content,
            postId: comments.postId,
            authorId: comments.authorId,
            parentId: comments.parentId,
            createdAt: comments.createdAt,
            updatedAt: comments.updatedAt,
            author: {
              id: profiles.id,
              username: profiles.username,
              fullName: profiles.fullName,
              avatarUrl: profiles.avatarUrl,
            },
          })
          .from(comments)
          .leftJoin(profiles, eq(comments.authorId, profiles.id))
          .where(eq(comments.postId, input.postId))
          .orderBy(desc(comments.createdAt));

        // Build nested comment tree
        const commentMap = new Map<string, CommentWithDetails>();
        const rootComments: CommentWithDetails[] = [];

        // First pass: create all comment objects
        allComments.forEach((comment) => {
          const commentWithDetails: CommentWithDetails = {
            ...comment,
            author: comment.author!,
            replies: [],
          };
          commentMap.set(comment.id, commentWithDetails);
        });

        // Second pass: build tree structure
        allComments.forEach((comment) => {
          const commentWithDetails = commentMap.get(comment.id)!;

          if (comment.parentId) {
            const parent = commentMap.get(comment.parentId);
            if (parent) {
              parent.replies = parent.replies || [];
              parent.replies.push(commentWithDetails);
            }
          } else {
            rootComments.push(commentWithDetails);
          }
        });

        return rootComments;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch comments',
        });
      }
    }),

  /**
   * Create a comment
   * Protected endpoint
   */
  create: protectedProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        content: z.string().min(1).max(2000),
        parentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify post exists
        const [post] = await ctx.db
          .select({ id: posts.id, status: posts.status })
          .from(posts)
          .where(eq(posts.id, input.postId))
          .limit(1);

        if (!post) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Post not found',
          });
        }

        // Only allow comments on published posts
        if (post.status !== 'published') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot comment on unpublished posts',
          });
        }

        // If replying to a comment, verify it exists and belongs to the same post
        if (input.parentId) {
          const [parentComment] = await ctx.db
            .select({ postId: comments.postId })
            .from(comments)
            .where(eq(comments.id, input.parentId))
            .limit(1);

          if (!parentComment) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Parent comment not found',
            });
          }

          if (parentComment.postId !== input.postId) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Parent comment belongs to a different post',
            });
          }
        }

        // Create comment
        const [newComment] = await ctx.db
          .insert(comments)
          .values({
            content: input.content,
            postId: input.postId,
            parentId: input.parentId || null,
            authorId: ctx.user.id,
          })
          .returning();

        if (!newComment) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create comment',
          });
        }

        // Get author details
        const [author] = await ctx.db
          .select({
            id: profiles.id,
            username: profiles.username,
            fullName: profiles.fullName,
            avatarUrl: profiles.avatarUrl,
          })
          .from(profiles)
          .where(eq(profiles.id, ctx.user.id))
          .limit(1);

        return {
          ...newComment,
          author: author!,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create comment',
        });
      }
    }),

  /**
   * Update a comment
   * Protected endpoint - only comment author can update
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const [existing] = await ctx.db
          .select({ authorId: comments.authorId })
          .from(comments)
          .where(eq(comments.id, input.id))
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Comment not found',
          });
        }

        if (existing.authorId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only update your own comments',
          });
        }

        const [updatedComment] = await ctx.db
          .update(comments)
          .set({
            content: input.content,
            updatedAt: new Date(),
          })
          .where(eq(comments.id, input.id))
          .returning();

        return updatedComment;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update comment',
        });
      }
    }),

  /**
   * Delete a comment
   * Protected endpoint - only comment author can delete
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const [existing] = await ctx.db
          .select({ authorId: comments.authorId })
          .from(comments)
          .where(eq(comments.id, input.id))
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Comment not found',
          });
        }

        if (existing.authorId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only delete your own comments',
          });
        }

        // Delete comment (replies will cascade)
        await ctx.db.delete(comments).where(eq(comments.id, input.id));

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete comment',
        });
      }
    }),

  /**
   * Get comment count for a post
   * Public endpoint
   */
  getCountByPostId: publicProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const [result] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(comments)
          .where(eq(comments.postId, input.postId));

        return { count: result?.count || 0 };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch comment count',
        });
      }
    }),
});
