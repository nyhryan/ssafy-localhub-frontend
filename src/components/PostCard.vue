<script setup lang="ts">
import { computed } from "vue";
import type { Post, PostListItem } from "../types/api";
import { Eye, Heart } from "lucide-vue-next";

const props = defineProps<{
  post: Post | PostListItem;
}>();

const author = computed(() =>
  "author" in props.post ? props.post.author : "-"
);

const views = computed(() =>
  "views" in props.post ? props.post.views : props.post.viewCount
);

const likes = computed(() =>
  "likes" in props.post ? props.post.likes : props.post.likeCount
);
</script>

<template>
  <RouterLink
    :to="`/posts/${post.id}`"
    class="post-card"
    :aria-label="`게시글 상세 보기: ${post.title}`"
    as="article"
  >
    <span class="card-tag">{{ post.category_name }}</span>

    <strong class="post-title">
      {{ post.title }}
    </strong>

    <!-- 최대 3줄까지만 표시 -->
    <p class="muted post-content">
      {{ post.content }}
    </p>

    <div
      class="meta"
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      "
    >
      <span>{{ author }}</span>

      <span style="display: flex; align-items: center; gap: 12px">
        <span style="display: flex; align-items: center; gap: 4px">
          {{ new Date(post.created_at).toLocaleDateString("ko-KR") }}
        </span>

        <span style="display: flex; align-items: center; gap: 4px">
          <Eye :size="16" />
          {{ views }}
        </span>

        <span style="display: flex; align-items: center; gap: 4px">
          <Heart :size="16" />
          {{ likes }}
        </span>
      </span>
    </div>
  </RouterLink>
</template>

<style scoped>
.post-content {
  line-height: 1.6;

  /* 3줄까지만 표시 */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  overflow: hidden;
  text-overflow: ellipsis;

  /* 최신 브라우저 대응 */
  line-clamp: 3;
}
</style>