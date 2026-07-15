// src/mocks/handlers.ts

import { http, HttpResponse, delay } from 'msw'
import Mock from 'mockjs'
import {
  mockPosts,
  mockPlaces,
  mockFestivals,
  getNextPostId,
  normalize,
  paginate,
  readLikedIds,
  writeLikedIds,
  clone,
} from '../data'
import type { PostInput } from '../../types/api'

export const handlers = [
  // ==========================================
  // 1. 큐레이션 카테고리 데이터
  // ==========================================
  http.get('/api/v1/categories', async ({ request }) => {
    await delay(100)
    const url = new URL(request.url)
    const filter = url.searchParams.get('filter')?.trim() ?? ''
    const page = Number(url.searchParams.get('page')) || 1

    const filtered = mockPlaces.filter((place) => !filter || filter === '전체' || place.category === filter)
    const paginated = paginate(filtered, page, 6)

    return HttpResponse.json({
      places: paginated.items,
      pages: paginated.pages,
    })
  }),

  // ==========================================
  // 2. 최근 게시글 목록 조회
  // ==========================================
  http.get('/api/v1/posts/recent', async () => {
    await delay(100)
    return HttpResponse.json({
      posts: clone(mockPosts.slice(0, 4)),
    })
  }),

  // ==========================================
  // 3. 게시글 목록 조회 및 탐색
  // ==========================================
  http.get('/api/v1/posts', async ({ request }) => {
    await delay(100)
    const url = new URL(request.url)
    const category = url.searchParams.get('category')?.trim() ?? ''
    const query = normalize(url.searchParams.get('query') ?? '')
    const page = Number(url.searchParams.get('page')) || 1
    const pageSize = Number(url.searchParams.get('pageSize')) || 6

    const filtered = mockPosts.filter((post) => {
      const categoryMatch = !category || category === '전체' || post.category === category
      const queryMatch =
        !query ||
        [post.title, post.content, post.author, post.category].some((value) =>
          normalize(String(value)).includes(query),
        )
      return categoryMatch && queryMatch
    })

    return HttpResponse.json(paginate(filtered, page, pageSize))
  }),

  // ==========================================
  // 4. 게시글 상세 조회
  // ==========================================
  http.get('/api/v1/posts/:id', async ({ params }) => {
    await delay(60)
    const id = Number(params.id)
    const post = mockPosts.find((item) => item.id === id)

    if (!post) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(clone(post))
  }),

  // ==========================================
  // 5. 게시글 작성
  // ==========================================
  http.post('/api/v1/posts', async ({ request }) => {
    await delay(120)
    const body = (await request.json()) as PostInput

    if (!body.title || !body.content || !body.author || !body.password) {
      return new HttpResponse(null, { status: 400 })
    }

    const newPost = {
      id: getNextPostId(),
      category: body.category,
      title: body.title,
      content: body.content,
      author: body.author,
      password: body.password,
      created_at: new Date().toISOString(),
      viewCount: 0,
      likeCount: 0,
      region: 'LOCAL',
      tags: Mock.Random.pick([
        ['지역', '공유'],
        ['후기', '추천'],
        ['탐색', '정보'],
      ]),
    }

    mockPosts.unshift(newPost)
    return HttpResponse.json({ id: newPost.id }, { status: 201 })
  }),

  // ==========================================
  // 6. 게시글 수정/삭제 권한 검증
  // ==========================================
  http.post('/api/v1/posts/:id/verify', async ({ request, params }) => {
    await delay(90)
    const id = Number(params.id)
    const body = (await request.json()) as { password?: string }
    const post = mockPosts.find((item) => item.id === id)

    if (!post) return new HttpResponse(null, { status: 404 })
    if (post.password !== body.password) return new HttpResponse(null, { status: 401 })

    return HttpResponse.json({ success: true })
  }),

  // ==========================================
  // 7. 게시글 수정
  // ==========================================
  http.put('/api/v1/posts/:id', async ({ request, params }) => {
    await delay(120)
    const id = Number(params.id)
    const body = (await request.json()) as Partial<PostInput>
    const post = mockPosts.find((item) => item.id === id)

    if (!post) return new HttpResponse(null, { status: 404 })

    if (body.category) post.category = body.category
    if (body.title) post.title = body.title
    if (body.content) post.content = body.content
    if (body.author) post.author = body.author

    return HttpResponse.json(clone(post))
  }),

  // ==========================================
  // 8. 게시글 삭제
  // ==========================================
  http.delete('/api/v1/posts/:id', async ({ request, params }) => {
    await delay(100)
    const id = Number(params.id)
    const index = mockPosts.findIndex((item) => item.id === id)

    if (index < 0) return new HttpResponse(null, { status: 404 })
    
    // Authorization 헤더나 바디로 비밀번호를 받는다고 가정 (여기서는 단순 삭제 처리)
    mockPosts.splice(index, 1)

    return new HttpResponse(null, { status: 204 })
  }),

  // ==========================================
  // 9. 챗봇 자연어 질의 및 지역 추천
  // ==========================================
  http.post('/api/v1/chat', async ({ request }) => {
    await delay(160)
    const body = (await request.json()) as { text?: string }
    if (!body.text) return new HttpResponse(null, { status: 400 })

    const normalized = normalize(body.text)
    const placeKeyword = normalized.includes('맛집') || normalized.includes('음식') || normalized.includes('추천')
    const festivalKeyword = normalized.includes('축제') || normalized.includes('일정') || normalized.includes('공연')
    const postKeyword = normalized.includes('게시글') || normalized.includes('글') || normalized.includes('커뮤니티')

    if (postKeyword) {
      const searchTerm = normalize(normalized.replace('게시글', '').replace('커뮤니티', '').trim())
      const matched = mockPosts
        .filter((post) => normalize(`${post.title} ${post.content} ${post.author}`).includes(searchTerm))
        .slice(0, 3)
      return HttpResponse.json({
        message: matched.length
          ? `게시글 ${matched.length}건을 찾았어요. 관련 글을 빠르게 확인해보세요.`
          : '게시글 검색어를 조금 더 구체적으로 입력해보세요.',
        items: matched.map((post) => ({ id: post.id, title: post.title, type: post.category, note: post.author })),
      })
    }

    if (festivalKeyword) {
      const matched = mockFestivals.slice(0, 3)
      return HttpResponse.json({
        message: '이번 달 축제 일정을 빠르게 추려봤어요.',
        items: matched.map((f) => ({ id: f.id, title: f.title, type: f.region, note: `${f.date} · ${f.location}` })),
      })
    }

    if (placeKeyword) {
      const searchTerm = normalized.replace('추천', '').trim()
      const matched = mockPlaces
        .filter((place) => normalize(`${place.category} ${place.region} ${place.title}`).includes(searchTerm))
        .slice(0, 3)
      return HttpResponse.json({
        message: '지역 장소 추천 결과를 모아봤어요.',
        items: matched.map((p) => ({ id: p.id, title: p.title, type: p.category, note: p.address })),
      })
    }

    return HttpResponse.json({
      message: '관광지, 맛집, 축제, 게시글 검색을 도와드릴 수 있어요. 원하는 지역이나 카테고리를 말해보세요.',
      items: mockPosts.slice(0, 2).map((post) => ({ id: post.id, title: post.title, type: post.category })),
    })
  }),

  // ==========================================
  // 10. 게시글 조회수 증가
  // ==========================================
  http.post('/api/v1/posts/:id/views', async ({ params }) => {
    const id = Number(params.id)
    const post = mockPosts.find((item) => item.id === id)
    if (!post) return new HttpResponse(null, { status: 404 })

    post.viewCount += 1
    return HttpResponse.json(clone(post))
  }),

  // ==========================================
  // 11. 게시글 좋아요 토글
  // ==========================================
  http.post('/api/v1/posts/:id/like', async ({ params, request }) => {
    await delay(60)
    const id = Number(params.id)
    const body = (await request.json().catch(() => ({}))) as { amount?: number }
    const post = mockPosts.find((item) => item.id === id)
    
    if (!post) return new HttpResponse(null, { status: 404 })

    const likedIds = readLikedIds()
    // 프론트에서 amount: 1 or -1을 넘겨줄 수도 있고, 서버가 토글할 수도 있음
    if (likedIds.has(id)) {
      likedIds.delete(id)
      post.likeCount = Math.max(0, post.likeCount - 1)
    } else {
      likedIds.add(id)
      post.likeCount += 1
    }
    writeLikedIds(likedIds)

    return HttpResponse.json(clone(post))
  }),

  // ==========================================
  // 12. 이미지 업로드 (모킹)
  // ==========================================
  http.post('/api/v1/images/upload', async () => {
    await delay(200)
    return HttpResponse.json(
      { imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80' },
      { status: 201 }
    )
  }),

  // ==========================================
  // 13. 월간 축제 일정 조회
  // ==========================================
  http.get('/api/v1/festivals', async () => {
    await delay(90)
    return HttpResponse.json(clone(mockFestivals))
  }),

  // ==========================================
  // 14. 축제 상세 정보 조회
  // ==========================================
  http.get('/api/v1/festivals/:id', async ({ params }) => {
    await delay(60)
    const id = Number(params.id)
    const festival = mockFestivals.find((item) => item.id === id)

    if (!festival) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(clone(festival))
  }),
]