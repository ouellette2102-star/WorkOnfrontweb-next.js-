'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FeedCard } from '@/components/feed/feed-card';
import { FeedSkeleton } from '@/components/feed/feed-skeleton';
import type { FeedPost, FeedApiResponse, FeedPagination } from '@/types/feed';

// Constants
const FETCH_TIMEOUT_MS = 8000; // 8s timeout to avoid infinite pending
const POSTS_PER_PAGE = 10;
const isDev = process.env.NODE_ENV === 'development';

// Static demo data (dev only, no external deps)
const DEMO_POSTS: FeedPost[] = [
  {
    id: "demo-1",
    workerName: "Alexandra N.",
    role: "Chef traiteur",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&w=200&h=200&q=80",
    mediaUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    description: "Service catering express pour un gala fintech. Menu 100% local.",
    likeCount: 128,
    isLiked: false,
    location: "Montreal - Vieux-Port",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    workerName: "Moussa Diallo",
    role: "Electricien certifie",
    avatarUrl: "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?auto=format&fit=facearea&w=200&h=200&q=80",
    mediaUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
    description: "Remise aux normes loft Mile-End + eclairage ambiance.",
    likeCount: 96,
    isLiked: false,
    location: "Montreal - Mile-End",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "demo-3",
    workerName: "Camila Ortega",
    role: "Designer interieur",
    avatarUrl: "https://images.unsplash.com/photo-1546456073-92b9f0a8d1d6?auto=format&fit=facearea&w=200&h=200&q=80",
    mediaUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
    description: "Transformation express pop-up store. Execution en 48h.",
    likeCount: 211,
    isLiked: false,
    location: "Quebec - Saint-Roch",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];

type FeedSource = "backend" | "demo" | null;

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingLikes, setPendingLikes] = useState<Record<string, boolean>>({});
  const [source, setSource] = useState<FeedSource>(null);
  const [pagination, setPagination] = useState<FeedPagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Ref to prevent concurrent fetches
  const isFetchingRef = useRef(false);

  // Check if more pages available
  const hasMorePages = pagination ? currentPage < pagination.totalPages : false;

  // Load demo data (dev only)
  const loadDemoData = useCallback(() => {
    setPosts(DEMO_POSTS);
    setSource('demo');
    setError(null);
    setIsLoading(false);
    setRefreshing(false);
  }, []);

  const loadPosts = useCallback(
    async (options: { isRefresh?: boolean; page?: number; append?: boolean } = {}) => {
      const { isRefresh = false, page = 1, append = false } = options;

      // Prevent concurrent fetches
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (append) {
        setIsLoadingMore(true);
      } else if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response = await fetch(`/api/feed?page=${page}&limit=${POSTS_PER_PAGE}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // Handle non-OK HTTP responses
        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          let errorMessage = "Erreur du serveur";
          let errorCode = `HTTP_${response.status}`;

          try {
            const parsed = JSON.parse(errorText);
            errorMessage = parsed?.error?.message ?? parsed?.message ?? errorMessage;
            errorCode = parsed?.error?.code ?? errorCode;
          } catch {
            // Keep defaults
          }

          if (!append) {
            setPosts([]);
            setSource(null);
          }
          setError({ code: errorCode, message: errorMessage });
          return;
        }

        const payload = (await response.json()) as FeedApiResponse;

        // Handle normalized response
        if (payload.ok === false) {
          if (!append) {
            setPosts([]);
            setSource(null);
          }
          setError(payload.error ?? { code: "UNKNOWN", message: "Erreur inconnue" });
        } else {
          // Success
          const feedData = payload.data ?? [];
          if (append) {
            setPosts((prev) => [...prev, ...feedData]);
          } else {
            setPosts(feedData);
          }
          setSource(payload.source);
          setPagination(payload.pagination);
          setCurrentPage(page);
          setError(null);
        }
      } catch (err) {
        clearTimeout(timeoutId);

        // Check if it's a timeout (AbortError)
        if (err instanceof Error && err.name === 'AbortError') {
          if (!append) {
            setPosts([]);
            setSource(null);
          }
          setError({
            code: "TIMEOUT",
            message: "Le chargement a pris trop de temps. Réessayez.",
          });
        } else {
          // Network or parsing error
          if (!append) {
            setPosts([]);
            setSource(null);
          }
          setError({
            code: "NETWORK_ERROR",
            message: err instanceof Error ? err.message : "Impossible de charger le fil",
          });
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [],
  );

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (hasMorePages && !isLoadingMore) {
      loadPosts({ page: currentPage + 1, append: true });
    }
  }, [hasMorePages, isLoadingMore, currentPage, loadPosts]);

  useEffect(() => {
    void loadPosts({ page: 1 });
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
    if (source === 'demo') return '🎭 Mode démo';
    if (source === 'backend') return `📡 ${posts.length} post${posts.length > 1 ? 's' : ''}`;
    return 'Connecte-toi pour liker les missions en temps réel.';
  }, [error, isLoading, source, posts.length]);

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
              {source && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  source === 'demo' 
                    ? 'bg-yellow-500/20 text-yellow-400' 
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {source === 'demo' ? '🎭 DEMO' : '🔴 LIVE'}
                </span>
              )}
              <span>{statusMessage}</span>
              <button
                type="button"
                onClick={() => loadPosts({ isRefresh: true, page: 1 })}
                className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70 transition hover:text-white disabled:opacity-50"
                disabled={refreshing || isLoading}
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
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={() => loadPosts({ page: 1 })}
                  className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-500"
                >
                  🔄 Réessayer
                </button>
                {isDev && (
                  <button
                    type="button"
                    onClick={loadDemoData}
                    className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                  >
                    🎭 Mode démo
                  </button>
                )}
              </div>
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
            <>
              {posts.map((post) => (
                <FeedCard key={post.id} post={post} onLike={handleToggleLike} likeDisabled={pendingLikes[post.id]} />
              ))}

              {/* Pagination / Load more */}
              {posts.length > 0 && (
                <div className="flex flex-col items-center gap-3 pt-4">
                  {hasMorePages ? (
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="rounded-xl border border-white/20 bg-white/5 px-8 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                    >
                      {isLoadingMore ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Chargement...
                        </span>
                      ) : (
                        '📥 Charger plus'
                      )}
                    </button>
                  ) : pagination && pagination.total > 0 ? (
                    <p className="text-sm text-white/40">
                      ✅ Vous avez tout vu ({pagination.total} post{pagination.total > 1 ? 's' : ''})
                    </p>
                  ) : null}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}


