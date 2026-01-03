'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FeedCard } from '@/components/feed/feed-card';
import { FeedSkeleton } from '@/components/feed/feed-skeleton';
import { FeedApiResponse, FeedPost } from '@/types/feed';

type FeedSource = "backend" | "demo" | null;

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingLikes, setPendingLikes] = useState<Record<string, boolean>>({});
  const [source, setSource] = useState<FeedSource>(null);

  const loadPosts = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const response = await fetch('/api/feed', { cache: 'no-store' });
        const payload = (await response.json()) as FeedApiResponse;

        if (payload.ok) {
          // Success: backend or demo data
          setPosts(payload.data ?? []);
          setSource(payload.source);
          setError(null);
        } else {
          // Error from API (normalized)
          setPosts([]);
          setSource(null);
          setError(payload.error ?? { code: "UNKNOWN", message: "Erreur inconnue" });
        }
      } catch (err) {
        // Network or parsing error
        setPosts([]);
        setSource(null);
        setError({
          code: "NETWORK_ERROR",
          message: err instanceof Error ? err.message : "Impossible de charger le fil",
        });
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const handleToggleLike = useCallback(
    async (postId: string) => {
      const currentPost = posts.find((post) => post.id === postId);
      if (!currentPost) return;

      const optimisticLiked = !currentPost.isLiked;
      const optimisticLikeCount = Math.max(0, currentPost.likeCount + (optimisticLiked ? 1 : -1));

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, isLiked: optimisticLiked, likeCount: optimisticLikeCount } : post,
        ),
      );
      setPendingLikes((prev) => ({ ...prev, [postId]: true }));

      try {
        const res = await fetch('/api/feed/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId }),
        });

        if (!res.ok) {
          throw new Error('Like request failed');
        }

        const data = (await res.json()) as { postId: string; liked: boolean; likeCount: number };
        setPosts((prev) =>
          prev.map((post) =>
            post.id === data.postId ? { ...post, isLiked: data.liked, likeCount: data.likeCount } : post,
          ),
        );
      } catch {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, isLiked: currentPost.isLiked, likeCount: currentPost.likeCount } : post,
          ),
        );
      } finally {
        setPendingLikes((prev) => ({ ...prev, [postId]: false }));
      }
    },
    [posts],
  );

  const statusMessage = useMemo(() => {
    if (isLoading) return 'Chargement du fil en cours...';
    if (error) return `⚠️ ${error.message}`;
    if (source === 'demo') return '🎭 Mode démo — données de démonstration';
    return 'Connecte-toi pour liker les missions en temps réel.';
  }, [error, isLoading, source]);

  const showEmpty = !isLoading && !error && posts.length === 0;
  const showError = !isLoading && error !== null;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 md:py-16">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-red-500">En direct</p>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold md:text-5xl">Le fil WorkOn</h1>
              <p className="mt-3 text-white/70">
                Les travailleurs de la communauté partagent leurs missions, coulisses et tips en temps réel.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80 md:text-base">
              <span>{statusMessage}</span>
              <button
                type="button"
                onClick={() => loadPosts(true)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70 transition hover:text-white"
                disabled={refreshing}
              >
                {refreshing ? 'Refresh...' : 'Rafraîchir'}
              </button>
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-6 pb-16">
          {isLoading ? (
            <>
              <FeedSkeleton />
              <FeedSkeleton />
            </>
          ) : showError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-12 text-center">
              <div className="mb-4 text-4xl">⚠️</div>
              <h3 className="mb-2 text-xl font-bold text-red-400">
                Feed indisponible
              </h3>
              <p className="mb-6 text-white/70">
                {error?.message ?? "Une erreur est survenue"}
              </p>
              <button
                type="button"
                onClick={() => loadPosts(false)}
                className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-500"
              >
                🔄 Réessayer
              </button>
              {error?.code && (
                <p className="mt-4 text-xs text-white/40">Code: {error.code}</p>
              )}
            </div>
          ) : showEmpty ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center text-white/70">
              Aucun post pour le moment. <br />
              <span className="text-white">Astuce :</span> réserve une mission, partage le résultat et tagge @WorkOn.
            </div>
          ) : (
            posts.map((post) => (
              <FeedCard key={post.id} post={post} onLike={handleToggleLike} likeDisabled={pendingLikes[post.id]} />
            ))
          )}
        </section>
      </div>
    </main>
  );
}


