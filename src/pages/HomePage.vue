<script setup lang="ts">
import { onMounted, ref } from "vue";
import PostCard from "../components/PostCard.vue";
import { getCategories, getRecentPosts } from "../services/localhubApi";
import type { Place, Post } from "../types/api";

const recentPosts = ref<Post[]>([]);
const places = ref<Place[]>([]);

onMounted(async () => {
  const [posts, placeList] = await Promise.all([
    getRecentPosts(4),
    getCategories({ filter: "전체", pageSize: 4 }),
  ]);

  recentPosts.value = posts;
  places.value = placeList.places;
});
</script>

<template>
  <main class="page">
    <section class="surface">
      <div class="section-head">
        <div>
          <h2>큐레이션</h2>
          <p class="section-desc">장소 카드와 카테고리별 탐색을 연결합니다.</p>
        </div>
        <RouterLink class="button-ghost" to="/curation/all"
          >전체 보기</RouterLink
        >
      </div>

      <div class="grid-4" style="margin-top: 16px">
        <article v-for="place in places" :key="place.id" class="place-card">
          <img
            :src="place.image"
            :alt="place.title"
            style="
              height: 150px;
              width: 100%;
              object-fit: cover;
              border-radius: 18px;
            "
          />
          <span class="badge">{{ place.category_name }}</span>
          <strong class="place-title">{{ place.title }}</strong>
          <p class="muted">{{ place.address }}</p>
        </article>
      </div>
    </section>

    <section class="surface">
      <div class="section-head">
        <div>
          <h2>최근 게시글</h2>
          <p class="section-desc">
            서울에서 일어나는 최근 소식을 확인해보세요.
          </p>
        </div>
        <RouterLink class="button-ghost" to="/posts">더보기</RouterLink>
      </div>

      <div class="grid-2" style="margin-top: 16px">
        <PostCard v-for="post in recentPosts" :key="post.id" :post="post" />
      </div>

      <section
        v-if="recentPosts.length === 0"
        class="empty-state"
        style="margin-top: 16px"
      >
        최근 게시물이 없습니다.
      </section>
    </section>
  </main>
</template>
