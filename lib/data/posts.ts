export type PostType =
  | "achievement"
  | "activity"
  | "announcement"
  | "food"
  | "mood"
  | "nap"
  | "photo";

export interface PostPhoto {
  id: string;
  url: string;
  width?: number;
  height?: number;
  position: number;
  signedUrl?: string;
}

export interface PostComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface Post {
  id: string;
  type: PostType;
  childName?: string;
  audience: string;
  time: string;
  authorNote: string;
  text: string;
  photos: PostPhoto[];
  likes: number;
  comments: number;
  commentsList: PostComment[];
  userHasLiked?: boolean;
  publishedAt: string;
}
