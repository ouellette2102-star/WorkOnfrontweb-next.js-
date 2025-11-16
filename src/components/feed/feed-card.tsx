'use client';

import { useMemo } from 'react';
import { FeedPost } from '@/types/feed';
import { Heart, MessageCircle } from 'lucide-react';

type FeedCardProps = {
  post: FeedPost;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  likeDisabled?: boolean;
};

export function FeedCard({ post, onLike, onComment, likeDisabled }: FeedCardProps) {
  const createdAtLabel = useMemo(() => {
    const date = new Date(post.createdAt);
    return date.toLocaleDateString('fr-CA', {
      day: 'numeric',
      month: 'short',
    });
  }, [post.createdAt]);

  return (
    <article className="rounded-2xl border border-white/10 bg-neutral-900/70 shadow-2xl shadow-black/30 backdrop-blur">
      <header className="flex items-center gap-3 px-4 py-3">
        <div className="h-12 w-12 flex-shrink-0 rounded-full border border-white/10 bg-neutral-800">
          <img
            src={post.avatarUrl}
            alt={post.workerName}
            className="h-full w-full rounded-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold">{post.workerName}</span>
          <span className="text-sm text-white/70">{post.role}</span>
        </div>
        <div className="ml-auto text-right text-xs text-white/50">
          <p>{createdAtLabel}</p>
          {post.location ? <p>{post.location}</p> : null}
        </div>
      </header>

      <div className="space-y-3 px-4 pb-4">
        <p className="text-sm text-white/80">{post.description}</p>

        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-neutral-800/50">
          <img
            src={post.mediaUrl}
            alt={post.description}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <footer className="flex items-center gap-4 border-t border-white/5 px-4 py-3 text-sm">
        <button
          type="button"
          onClick={() => onLike?.(post.id)}
          disabled={likeDisabled}
          className={`flex items-center gap-2 rounded-full px-4 py-2 transition-colors ${
            post.isLiked ? 'bg-red-600/80 text-white' : 'bg-white/5 text-white/80 hover:bg-white/10'
          } ${likeDisabled ? 'opacity-70' : ''}`}
        >
          <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
          <span>{post.likeCount}</span>
        </button>

        <button
          type="button"
          onClick={() => onComment?.(post.id)}
          className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-white/80 transition-colors hover:bg-white/10"
        >
          <MessageCircle className="h-4 w-4" />
          Commenter
        </button>
      </footer>
    </article>
  );
}



