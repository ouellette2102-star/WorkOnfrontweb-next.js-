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

export type FeedApiResponse = {
  data: FeedPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};


