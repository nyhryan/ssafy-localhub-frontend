<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import PostCard from "../components/PostCard.vue";
import { getCategories, getRecentPosts } from "../services/localhubApi";
import type { Place, PostListItem } from "../types/api";

const recentPosts = ref<PostListItem[]>([]);
const places = ref<Place[]>([]);

// Fallback 이미지
const fallbackImage = new URL("../assets/fallback.png", import.meta.url).href;

// 각 장소마다 이미지 결정
const placeWithImage = computed(() => {
  return places.value.slice(0, 8).map((place) => ({
    ...place,
    displayImage: place.image && place.image.trim() 
      ? place.image 
      : fallbackImage,
  }));
});

onMounted(async () => {
  try {
    // 1. 전체 카테고리 목록 정의
    const allCategories = ["관광지", "문화시설", "축제공연", "행사", "숙박", "레포츠", "쇼핑", "여행코스"];

    // 2. 모든 카테고리의 데이터를 동시에 조회
    const [postsResult, ...categoryResults] = await Promise.allSettled([
      getRecentPosts(8),
      ...allCategories.map((cat) => getCategories({ filter: cat, page: 1 })),
    ]);

    // 최근 게시글 처리
    if (postsResult.status === "fulfilled") {
      recentPosts.value = postsResult.value;
    }

    // 3. 데이터가 최소 2개 이상 존재하는 카테고리만 필터링
    const availableCategories: { name: string; places: Place[] }[] = [];
    categoryResults.forEach((result, idx) => {
      if (result.status === "fulfilled" && result.value && result.value.places) {
        if (result.value.places.length >= 2) {
          availableCategories.push({
            name: allCategories[idx],
            places: result.value.places
          });
        }
      }
    });

    // 4. 후보 카테고리 목록 중 무작위로 4개만 선택
    const targetCategories = [...availableCategories]
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    // 5. 선택된 4개 카테고리 각각의 데이터 리스트를 무작위로 섞은 뒤 2개씩 추출
    const mixedPlaces: Place[] = [];
    targetCategories.forEach((catInfo) => {
      // 해당 카테고리가 가진 전체 장소 목록을 복사하여 무작위로 섞음
      const shuffledPlacesInCat = [...catInfo.places].sort(() => Math.random() - 0.5);
      // 완전히 섞인 목록에서 상위 2개를 추출하여 병합
      mixedPlaces.push(...shuffledPlacesInCat.slice(0, 2));
    });

    // 6. 최종 8개의 장소 카드를 다시 한번 전체적으로 무작위 정렬하여 화면에 배치
    places.value = mixedPlaces.sort(() => Math.random() - 0.5);

  } catch (error) {
    console.error("데이터 로딩 중 에러 발생:", error);
  }
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
        <RouterLink class="button-ghost" to="/curation/all">더보기</RouterLink>
      </div>

      <div class="grid-4" style="margin-top: 16px">
        <article v-for="place in placeWithImage" :key="place.id" class="place-card">
          <img
            :src="place.displayImage"
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
