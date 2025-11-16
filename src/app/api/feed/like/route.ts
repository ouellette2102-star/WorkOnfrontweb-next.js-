import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const LikeSchema = z.object({
  postId: z.string().min(1),
});

export async function POST(request: Request) {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let postId: string;
  try {
    const body = await request.json();
    const parsed = LikeSchema.parse(body);
    postId = parsed.postId;
  } catch (error) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }

  try {
    const internalUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true, profile: true },
    });

    if (!internalUser) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
    }

    const profileData = internalUser.profile ?? {};
    const hasProfile =
      typeof profileData === 'object' &&
      !Array.isArray(profileData) &&
      typeof (profileData as { primaryRole?: unknown }).primaryRole === 'string';

    if (!hasProfile) {
      return NextResponse.json({ error: 'Profil incomplet' }, { status: 403 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 });
    }

    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId: post.id,
          userId: internalUser.id,
        },
      },
    });

    let liked: boolean;
    let likeCount: number;

    if (existingLike) {
      const [, updatedPost] = await prisma.$transaction([
        prisma.postLike.delete({ where: { id: existingLike.id } }),
        prisma.post.update({
          where: { id: post.id },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        }),
      ]);

      liked = false;
      likeCount = Math.max(0, updatedPost.likeCount);
    } else {
      const [, updatedPost] = await prisma.$transaction([
        prisma.postLike.create({
          data: {
            postId: post.id,
            userId: internalUser.id,
          },
        }),
        prisma.post.update({
          where: { id: post.id },
          data: { likeCount: { increment: 1 } },
          select: { likeCount: true },
        }),
      ]);

      liked = true;
      likeCount = updatedPost.likeCount;
    }

    return NextResponse.json({ postId: post.id, liked, likeCount });
  } catch (error) {
    console.error('[FEED_LIKE_ERROR]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}


