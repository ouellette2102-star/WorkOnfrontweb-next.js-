export type FeedPost = {
  id: string;
  workerName: string;
  role: string;
  avatarUrl: string;
  mediaUrl: string;
  description: string;
  likeCount: number;
  isLiked: boolean;
  location?: string | null;
  createdAt: string;
};

export type FeedPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * Normalized API response (PR-17)
 * Always returns a stable shape regardless of backend status
 */
export type FeedApiResponse =
  | {
      ok: true;
      data: FeedPost[];
      source: "backend" | "demo";
      pagination: FeedPagination;
    }
  | {
      ok: false;
      data: [];
      error: { code: string; message: string };
      source: "backend";
    };

/**
 * @deprecated Use FeedApiResponse instead
 * Legacy response format for backward compatibility
 */
export type LegacyFeedApiResponse = {
  data: FeedPost[];
  pagination: FeedPagination;
};

