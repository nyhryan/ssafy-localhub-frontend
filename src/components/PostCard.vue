<script setup lang="ts">
import type { Post } from '../types/api'
import { Eye, Heart } from 'lucide-vue-next';

defineProps<{
  post: Post
}>()
</script>

<template>
  <article class="post-card">
    <span class="card-tag">{{ post.category }}</span>
    <RouterLink :to="`/posts/${post.id}`" class="post-title">{{ post.title }}</RouterLink>
    <p class="muted">{{ post.content }}</p>
    <div class="meta" style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
      <span>{{ post.author }}</span>
      <span style="display: flex; align-items: center; gap: 12px;">
        <span style="display: flex; align-items: center; gap: 4px;">
        {{ new Date(post.created_at).toLocaleDateString('ko-KR') }}
        </span>
        <span style="display: flex; align-items: center; gap: 4px;">
          <Eye :size="16" /> {{ post.viewCount }}
        </span>
        <span style="display: flex; align-items: center; gap: 4px;">
          <Heart :size="16" /> {{ post.likeCount }}
        </span>
      </span>
    </div>
  </article>
</template>