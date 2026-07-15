// src/api/localhubApi.ts (또는 원하는 파일명)

// src/api/localhubApi.ts (또는 원하는 파일명)
import type {
  Post,
  PostInput,
  PostListResponse,
  PlaceListResponse,
  Festival,
  ChatResponse,
  DashboardSummary,
} from '../types/api';
import { postCategories } from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL

// ==========================================
// 1. 큐레이션 카테고리 데이터
// ==========================================
export async function getCategories(params: { filter?: string; page?: number; pageSize?: number }): Promise<PlaceListResponse> {
  const urlParams = new URLSearchParams()
  if (params.filter && params.filter !== '전체') urlParams.append('filter', params.filter)
  if (params.page) urlParams.append('page', params.page.toString())
  if (params.pageSize) urlParams.append('pageSize', params.pageSize.toString())

  const res = await fetch(`${API_BASE}/categories?${urlParams.toString()}`)
  if (!res.ok) throw new Error('카테고리 데이터를 불러오는데 실패했습니다.')
  return res.json()
}

// ==========================================
// 2. 최근 게시글 목록 조회
// ==========================================
export async function getRecentPosts(): Promise<{ posts: Post[] }> {
  const res = await fetch(`${API_BASE}/posts/recent`)
  if (!res.ok) throw new Error('최근 게시글을 불러오는데 실패했습니다.')
  return res.json()
}

// ==========================================
// 3. 게시글 목록 조회 및 탐색
// ==========================================
export async function getPosts(params: { category_name?: string; query?: string; page?: number; pageSize?: number }): Promise<PostListResponse> {
  const urlParams = new URLSearchParams()
  if (params.category_name) urlParams.append('category_name', params.category_name)
  if (params.query) urlParams.append('query', params.query)
  if (params.page) urlParams.append('page', params.page.toString())
  if (params.pageSize) urlParams.append('pageSize', params.pageSize.toString())

  const res = await fetch(`${API_BASE}/posts?${urlParams.toString()}`)
  if (!res.ok) throw new Error('게시글 목록을 불러오는데 실패했습니다.')
  return res.json()
}

// ==========================================
// 4. 게시글 상세 조회
// ==========================================
export async function getPostById(id: number): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts/${id}`)
  if (res.status === 404) throw new Error('게시글을 찾을 수 없습니다.')
  if (!res.ok) throw new Error('게시글 상세 정보를 불러오는데 실패했습니다.')
  return res.json()
}

// ==========================================
// 5. 게시글 작성
// ==========================================
export async function createPost(input: PostInput): Promise<{ id: number }> {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('게시글 작성에 실패했습니다.')
  return res.json()
}

// ==========================================
// 6. 게시글 수정/삭제 권한 검증
// ==========================================
export async function verifyPostPassword(id: number, password: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/posts/${id}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (res.status === 401) throw new Error('비밀번호가 일치하지 않습니다.')
  if (!res.ok) throw new Error('권한 검증에 실패했습니다.')
  return true
}

// ==========================================
// 7. 게시글 수정
// ==========================================
export async function updatePost(id: number, input: Partial<PostInput>): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (res.status === 403 || res.status === 401) throw new Error('수정 권한이 없습니다.')
  if (!res.ok) throw new Error('게시글 수정에 실패했습니다.')
  return res.json()
}

// ==========================================
// 8. 게시글 삭제
// ==========================================
export async function deletePost(id: number, password: string): Promise<void> {
  // 실제 API 명세에 따라 password를 body로 보낼지 header로 보낼지 조정이 필요할 수 있습니다.
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (res.status === 403 || res.status === 401) throw new Error('삭제 권한이 없습니다.')
  if (!res.ok) throw new Error('게시글 삭제에 실패했습니다.')
}

// ==========================================
// 9. 챗봇 자연어 질의 및 지역 추천
// ==========================================
export async function chatRespond(text: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('챗봇 응답을 가져오는데 실패했습니다.')
  return res.json()
}

// ==========================================
// 10. 게시글 조회수 증가
// ==========================================
export async function incrementPostViews(id: number): Promise<void> {
  // TODO 나중에 추가
  // const res = await fetch(`${API_BASE}/posts/${id}/views`, { method: 'POST' })
  // if (!res.ok) throw new Error('조회수 업데이트에 실패했습니다.')
}

// ==========================================
// 11. 게시글 좋아요 토글
// ==========================================
export async function togglePostLike(id: number, amount: number = 1): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts/${id}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  })
  if (!res.ok) throw new Error('좋아요 처리에 실패했습니다.')
  return res.json()
}

// ==========================================
// 12. 월간 축제 일정 조회
// ==========================================
export async function getFestivals(): Promise<Festival[]> {
  const res = await fetch(`${API_BASE}/festivals`)
  if (!res.ok) throw new Error('축제 일정을 불러오는데 실패했습니다.')
  return res.json()
}

// ==========================================
// 13. 대시보드 요약 정보 (별도 API가 없다면 기존 API들을 활용해 집계)
// ==========================================
export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    // 병렬로 필요한 데이터를 모두 요청합니다.
    const [postsRes, placesRes, festivalsRes] = await Promise.all([
      getPosts({ pageSize: 100 }), // 카운트를 위해 충분히 큰 사이즈 혹은 별도 카운트 API 필요
      getCategories({ pageSize: 1 }),
      getFestivals()
    ])

    const totalPosts = postsRes.pages.total
    const totalPlaces = placesRes.pages.total
    const totalFestivals = festivalsRes.length

    // 임시로 상위 4개 카테고리 집계 (실제로는 백엔드에서 전용 API를 제공하는 것이 좋습니다)
    const categoryCounts: Record<string, number> = {}
    postsRes.items.forEach(post => {
      categoryCounts[post.category_name] = (categoryCounts[post.category_name] || 0) + 1
    })

    const topCategories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)

    return { totalPosts, totalPlaces, totalFestivals, topCategories }
  } catch (error) {
    console.error("대시보드 요약 정보를 가져오지 못했습니다.", error)
    return { totalPosts: 0, totalPlaces: 0, totalFestivals: 0, topCategories: [] }
  }
}

export const getPostCategories = () => ['전체', ...postCategories]