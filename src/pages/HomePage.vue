<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getCategories, getDashboardSummary, getFestivals, getRecentPosts } from '../services/localhubApi'
import type { Festival, Place, Post } from '../types/api'

const recentPosts = ref<Post[]>([])
const places = ref<Place[]>([])
const festivals = ref<Festival[]>([])
const stats = ref({ totalPosts: 0, totalPlaces: 0, totalFestivals: 0 })

onMounted(async () => {
  const [{ posts }, placeList, festivalList, summary] = await Promise.all([
    getRecentPosts(),
    getCategories({ filter: '전체', pageSize: 4 }),
    getFestivals(),
    getDashboardSummary(),
  ])

  recentPosts.value = posts
  places.value = placeList.items
  festivals.value = festivalList.slice(0, 3)
  stats.value = summary
})
</script>

<template>
  <main class="page">
    <section class="surface">
      <div class="section-head">
        <div>
          <h2>큐레이션</h2>
          <p class="section-desc">장소 카드와 카테고리별 탐색을 연결합니다.</p>
        </div>
        <RouterLink class="button-ghost" to="/curation/all">전체 보기</RouterLink>
      </div>

      <div class="grid-4" style="margin-top: 16px">
        <article v-for="place in places" :key="place.id" class="place-card">
          <img :src="place.image" :alt="place.title" style="height: 150px; width: 100%; object-fit: cover; border-radius: 18px" />
          <span class="badge">{{ place.category }}</span>
          <strong class="place-title">{{ place.title }}</strong>
          <p class="muted">{{ place.address }}</p>
        </article>
      </div>
    </section>

    <section class="surface">
      <div class="section-head">
        <div>
          <h2>최근 게시글</h2>
          <p class="section-desc">서울에서 일어나는 최근 소식을 확인해보세요.</p>
        </div>
        <RouterLink class="button-ghost" to="/posts">더보기</RouterLink>
      </div>

      <div class="grid-2" style="margin-top: 16px">
        <RouterLink v-for="post in recentPosts" :key="post.id" :to="`/posts/${post.id}`" class="post-card">
          <span class="card-tag">{{ post.category }}</span>
          <strong class="post-title">{{ post.title }}</strong>
          <p class="muted">{{ post.content }}</p>
          <div class="meta">{{ post.author }} · 조회 {{ post.viewCount }} · 좋아요 {{ post.likeCount }}</div>
        </RouterLink>
      </div>
    </section>

    <section class="surface">
      <div class="section-head">
        <div>
          <h2>다가오는 축제</h2>
          <p class="section-desc">챗봇과 캘린더에 함께 쓰는 축제 데이터입니다.</p>
        </div>
        <RouterLink class="button-ghost" to="/festivals">캘린더 보기</RouterLink>
      </div>

      <div class="grid-3" style="margin-top: 16px">
        <article v-for="festival in festivals" :key="festival.id" class="stat-card">
          <div class="badge">{{ festival.region }}</div>
          <strong style="display: block; margin-top: 10px">{{ festival.title }}</strong>
          <p class="muted" style="margin-top: 8px">{{ festival.date }} · {{ festival.location }}</p>
          <p style="margin-top: 10px; line-height: 1.6">{{ festival.summary }}</p>
        </article>
      </div>
    </section>
  </main>
</template>