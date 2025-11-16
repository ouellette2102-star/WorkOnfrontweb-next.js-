'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FeedCard } from '@/components/feed/feed-card';
import { FeedSkeleton } from '@/components/feed/feed-skeleton';
import { FeedApiResponse, FeedPost } from '@/types/feed';

const FALLBACK_POSTS: FeedPost[] = [
  {
    id: 'post-1',
    workerName: 'Alexandra N.',
    role: 'Chef traiteur',
    avatarUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&w=200&h=200&q=80',
    mediaUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    description:
      'Service catering express pour un gala fintech. Menu 100% local, monté en 4h avec l’équipe WorkOn.',
    likeCount: 128,
    isLiked: false,
    location: 'Montréal • Vieux-Port',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'post-2',
    workerName: 'Moussa Diallo',
    role: 'Électricien certifié',
    avatarUrl:
      'https://images.unsplash.com/photo-1544006659-f0b21884ce1d?auto=format&fit=facearea&w=200&h=200&q=80',
    mediaUrl:
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    description:
      'Remise aux normes d’un loft Mile-End + ajout éclairage d’ambiance. Réservation via WorkOn en moins de 30 min.',
    likeCount: 96,
    isLiked: false,
    location: 'Montréal • Mile-End',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'post-3',
    workerName: 'Camila Ortega',
    role: 'Designer d’intérieur',
    avatarUrl:
      'https://images.unsplash.com/photo-1546456073-92b9f0a8d1d6?auto=format&fit=facearea&w=200&h=200&q=80',
    mediaUrl:
      'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
    description:
      'Transformation express d’un pop-up store. Moodboard WorkOn + exécution en 48h.',
    likeCount: 211,
    isLiked: false,
    location: 'Québec • Saint-Roch',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingLikes, setPendingLikes] = useState<Record<string, boolean>>({});

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
      if (!response.ok) {
        throw new Error('Feed request failed');
      }
      const payload = (await response.json()) as FeedApiResponse;
      setPosts(payload.data);
    } catch (err) {
      setError("Impossible de charger le fil. Mode démo affiché.");
      if (!isRefresh) {
        setPosts(FALLBACK_POSTS);
      }
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
      } catch (err) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, isLiked: currentPost.isLiked, likeCount: currentPost.likeCount } : post,
          ),
        );
        setError("Action non disponible. Réessaie après connexion.");
      } finally {
        setPendingLikes((prev) => ({ ...prev, [postId]: false }));
      }
    },
    [posts],
  );

  const statusMessage = useMemo(
    () =>
      error
    ? error
    : isLoading
    ? 'Chargement du fil en cours...'
        : 'Connecte-toi pour liker les missions en temps réel.',
    [error, isLoading],
  );

  const showEmpty = !isLoading && posts.length === 0;

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


