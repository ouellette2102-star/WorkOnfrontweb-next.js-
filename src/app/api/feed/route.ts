import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FeedPost } from "@/types/feed";

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&w=200&h=200&q=80";

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 10));
    const skip = (page - 1) * limit;

    const [posts, total, internalUser] = await Promise.all([
      prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          workerProfile: {
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
            },
          },
        },
      }),
      prisma.post.count(),
      clerkUserId
        ? prisma.user.findUnique({
            where: { clerkId: clerkUserId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    let likedIds = new Set<string>();
    if (internalUser && posts.length > 0) {
      const likes = await prisma.postLike.findMany({
        where: {
          userId: internalUser.id,
          postId: { in: posts.map((post) => post.id) },
        },
        select: { postId: true },
      });
      likedIds = new Set(likes.map((like) => like.postId));
    }

    const data: FeedPost[] = posts.map((post) => {
      const profile = post.workerProfile.user.profile;
      return {
        id: post.id,
        workerName: profile?.name ?? "Pro WorkOn",
        role: profile?.role ?? "Expert WorkOn",
        avatarUrl: FALLBACK_AVATAR,
        mediaUrl: post.mediaUrl,
        description: post.description,
        likeCount: post.likeCount,
        isLiked: likedIds.has(post.id),
        location: null,
        createdAt: post.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("[FEED_GET_ERROR]", error);
    return NextResponse.json({ error: "Unable to load feed" }, { status: 500 });
  }
}


