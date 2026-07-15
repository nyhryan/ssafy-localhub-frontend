<script setup lang="ts">
import { computed } from 'vue'
import type { Post, PostListItem } from '../types/api'
import { Eye, Heart } from 'lucide-vue-next';

const props = defineProps<{
  post: Post | PostListItem
}>()

const author = computed(() => 'author' in props.post ? props.post.author : '-')
const views = computed(() => 'views' in props.post ? props.post.views : props.post.viewCount)
const likes = computed(() => 'likes' in props.post ? props.post.likes : props.post.likeCount)
</script>

<template>
  <article class="post-card">
    <span class="card-tag">{{ post.category_name }}</span>
    <RouterLink :to="`/posts/${post.id}`" class="post-title">{{ post.title }}</RouterLink>
    <p class="muted">{{ post.content }}</p>
    <div class="meta" style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
      <span>{{ author }}</span>
      <span style="display: flex; align-items: center; gap: 12px;">
        <span style="display: flex; align-items: center; gap: 4px;">
        {{ new Date(post.created_at).toLocaleDateString('ko-KR') }}
        </span>
        <span style="display: flex; align-items: center; gap: 4px;">
          <Eye :size="16" /> {{ views }}
        </span>
        <span style="display: flex; align-items: center; gap: 4px;">
          <Heart :size="16" /> {{ likes }}
        </span>
      </span>
    </div>
  </article>
</template>