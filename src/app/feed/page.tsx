'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FeedCard } from '@/components/feed/feed-card';
import { FeedSkeleton } from '@/components/feed/feed-skeleton';
import type { FeedPost } from '@/types/feed';

// Constants
const FETCH_TIMEOUT_MS = 8000; // 8s timeout to avoid infinite pending
const isDev = process.env.NODE_ENV === 'development';

// API response type (handles both old and new formats)
type ApiResponse = {
  ok?: boolean;
  data?: FeedPost[];
  source?: "backend" | "demo";
  error?: { code: string; message: string };
};

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
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingLikes, setPendingLikes] = useState<Record<string, boolean>>({});
  const [source, setSource] = useState<FeedSource>(null);

  // Ref to prevent concurrent fetches
  const isFetchingRef = useRef(false);

  // Load demo data (dev only)
  const loadDemoData = useCallback(() => {
    setPosts(DEMO_POSTS);
    setSource('demo');
    setError(null);
    setIsLoading(false);
    setRefreshing(false);
  }, []);

  const loadPosts = useCallback(
    async (isRefresh = false) => {
      // Prevent concurrent fetches
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response = await fetch('/api/feed', {
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
            errorMessage = parsed?.message ?? parsed?.error ?? errorMessage;
            errorCode = parsed?.error?.code ?? errorCode;
          } catch {
            // Keep defaults
          }

          setPosts([]);
          setSource(null);
          setError({ code: errorCode, message: errorMessage });
          return;
        }

        const payload = (await response.json()) as ApiResponse;

        // Handle normalized response (with ok field) or legacy response
        if (payload.ok === false) {
          // Normalized error response
          setPosts([]);
          setSource(null);
          setError(payload.error ?? { code: "UNKNOWN", message: "Erreur inconnue" });
        } else {
          // Success: backend or demo data (handles both ok:true and legacy format)
          const feedData = payload.data ?? [];
          setPosts(feedData);
          setSource(payload.source ?? (feedData.length > 0 ? "backend" : null));
          setError(null);
        }
      } catch (err) {
        clearTimeout(timeoutId);

        // Check if it's a timeout (AbortError)
        if (err instanceof Error && err.name === 'AbortError') {
          setPosts([]);
          setSource(null);
          setError({
            code: "TIMEOUT",
            message: "Le chargement a pris trop de temps. Réessayez.",
          });
        } else {
          // Network or parsing error
          setPosts([]);
          setSource(null);
          setError({
            code: "NETWORK_ERROR",
            message: err instanceof Error ? err.message : "Impossible de charger le fil",
          });
        }
      } finally {
        setIsLoading(false);
        setRefreshing(false);
        isFetchingRef.current = false;
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
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={() => loadPosts(false)}
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
            posts.map((post) => (
              <FeedCard key={post.id} post={post} onLike={handleToggleLike} likeDisabled={pendingLikes[post.id]} />
            ))
          )}
        </section>
      </div>
    </main>
  );
}


