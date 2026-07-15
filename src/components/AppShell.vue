<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const routeLabel = computed(() => {
  switch (route.name) {
    case 'posts':
      return '게시글 탐색'
    case 'post-detail':
      return '게시글 상세'
    case 'post-create':
      return '게시글 작성'
    case 'post-edit':
      return '게시글 수정'
    case 'chat':
      return '챗봇'
    case 'curation':
    case 'curation-all':
      return '큐레이션'
    case 'dashboard':
      return '대시보드'
    case 'festivals':
      return '축제 캘린더'
    case 'map':
      return '지도'
    default:
      return '홈'
  }
})
</script>

<template>
  <div class="app-shell">
    <header class="shell-header">
      <RouterLink to="/" class="brand">
        <span class="brand-mark" aria-hidden="true" />
        <span>
          <span class="brand-title">로 컬 허 브</span>
          <span class="brand-subtitle">서울의 지역 정보를 서로 공유하세요.</span>
        </span>
      </RouterLink>

      <nav class="shell-nav" aria-label="주요 페이지">
        <RouterLink class="nav-link" to="/">홈</RouterLink>
        <RouterLink class="nav-link" to="/posts">게시글</RouterLink>
        <RouterLink class="nav-link" to="/curation">큐레이션</RouterLink>
        <RouterLink class="nav-link" to="/map">지도</RouterLink>
      </nav>
    </header>

    <slot />
  </div>
</template>