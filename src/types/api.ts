export const postCategories = [
  "관광지",
  "문화시설",
  "축제공연행사",
  "음식점",
  "숙박",
  "레포츠",
  "쇼핑",
  "여행코스",
] as const;

export type PostCategory = (typeof postCategories)[number];

/** Swagger `PostListItem` / `PostRead` shape */
export interface PostListItem {
  id: number;
  title: string;
  content: string;
  image_path: string | null;
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
  category_name?: string | null;
}

export interface Post {
  id: number;
  category_name: PostCategory;
  title: string;
  content: string;
  author: string;
  password: string;
  created_at: string;
  updated_at?: string;
  image_path?: string | null;
  viewCount: number;
  likeCount: number;
}

export interface PostInput {
  category_name: PostCategory;
  title: string;
  content: string;
  author: string;
  password: string;
}

export interface Place {
  id: number | string;
  category_name?: string | null;
  title: string;
  address?: string | null;
  image?: string | null;
  mapx?: number | null;
  mapy?: number | null;
  region?: string;
  description?: string;
}

export interface Festival {
  id: number;
  title: string;
  date: string;
  region: string;
  location: string;
  summary: string;
}

/** Swagger `PageInfoSchema` for categories */
export interface PageInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
}

/** Swagger `/api/v1/posts` list response */
export interface PostListResponse {
  items: PostListItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

/** Swagger `/api/v1/categories` response */
export interface PlaceListResponse {
  places: Place[];
  pages: PageInfo;
}

export interface ChatResponse {
  response: string | null;
}

export interface DashboardSummary {
  totalPosts: number;
  totalPlaces: number;
  totalFestivals: number;
  topCategories: Array<{ name: string; count: number }>;
}
