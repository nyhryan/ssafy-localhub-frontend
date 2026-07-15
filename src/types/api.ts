export const postCategories = [
  '관광지',
  '문화시설',
  '축제공연행사',
  '음식점',
  '숙박',
  '레포츠',
  '쇼핑',
  '여행코스',
] as const

export type PostCategory = (typeof postCategories)[number]

export interface Post {
  id: number
  category: PostCategory
  title: string
  content: string
  author: string
  password: string
  created_at: string
  viewCount: number
  likeCount: number
}

export interface PostInput {
  category: PostCategory
  title: string
  content: string
  author: string
  password: string
}

export interface Place {
  id: number
  category: PostCategory | '전체'
  title: string
  address: string
  image: string
  mapx: number
  mapy: number
  region: string
  description: string
}

export interface Festival {
  id: number
  title: string
  date: string
  region: string
  location: string
  summary: string
}

export interface PageResponse {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PostListResponse {
  items: Post[]
  pages: PageResponse
}

export interface PlaceListResponse {
  places: Place[]
  pages: PageResponse
}

export interface ChatResponse {
  message: string
  items: Array<{ id: number; title: string; type: string; note: string }>
}

export interface DashboardSummary {
  totalPosts: number
  totalPlaces: number
  totalFestivals: number
  topCategories: Array<{ name: string; count: number }>
}
