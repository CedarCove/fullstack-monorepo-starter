import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { profiles, eq } from '@grasp/database';

/**
 * Profile router using Drizzle ORM
 */
export const profileRouter = router({
  /**
   * Get current user's profile
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    try {
      const [profile] = await ctx.db
        .select()
        .from(profiles)
        .where(eq(profiles.id, ctx.user.id))
        .limit(1);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile not found',
        });
      }

      return profile;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch profile',
      });
    }
  }),

  /**
   * Update current user's profile
   */
  update: protectedProcedure
    .input(
      z.object({
        username: z.string().min(3).max(50).optional(),
        fullName: z.string().max(100).optional().nullable(),
        bio: z.string().max(500).optional().nullable(),
        avatarUrl: z.string().url().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [updatedProfile] = await ctx.db
          .update(profiles)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, ctx.user.id))
          .returning();

        if (!updatedProfile) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update profile',
          });
        }

        return updatedProfile;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update profile',
        });
      }
    }),

  /**
   * Get profile by username (public data only)
   */
  getByUsername: protectedProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const [profile] = await ctx.db
          .select({
            id: profiles.id,
            username: profiles.username,
            fullName: profiles.fullName,
            avatarUrl: profiles.avatarUrl,
            createdAt: profiles.createdAt,
          })
          .from(profiles)
          .where(eq(profiles.username, input.username))
          .limit(1);

        if (!profile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profile not found',
          });
        }

        return profile;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch profile',
        });
      }
    }),
});
