<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import PlaceCard from '../components/PlaceCard.vue'
import { getCategories, getPostCategories, type Place } from '../services/localhubApi'

const props = defineProps<{ mode?: 'all' }>()
const places = ref<Place[]>([])
const filter = ref(props.mode === 'all' ? '전체' : '전체')
const page = ref(1)
const totalPages = ref(1)
const categories = getPostCategories()

const load = async () => {
  const response = await getCategories({ filter: filter.value, page: page.value })
  places.value = response.items
  totalPages.value = response.pages.totalPages
}

onMounted(load)

watch(filter, async () => {
  page.value = 1
  await load()
})

const title = computed(() => (props.mode === 'all' ? '큐레이션 - 전체보기' : '큐레이션 - 카테고리 골라보기'))
</script>

<template>
  <main class="page">
    <section class="surface">
      <div class="section-head">
        <div>
          <h2>{{ title }}</h2>
          <p class="section-desc">장소 카드와 카테고리 필터로 지역 데이터를 탐색합니다.</p>
        </div>
        <RouterLink class="button" to="/map">지도 보기</RouterLink>
      </div>

      <div class="filter-row" style="margin-top: 18px">
        <button v-for="item in categories" :key="item" type="button" class="button-ghost" :class="{ 'button-secondary': filter === item }" @click="filter = item">{{ item }}</button>
      </div>
    </section>

    <section class="grid-2">
      <PlaceCard v-for="place in places" :key="place.id" :place="place" />
    </section>

    <section class="surface">
      <div class="pagination-container">
        <!-- 이전 버튼 -->
        <button class="pagination-arrow" :disabled="page <= 1" @click="page = Math.max(1, page - 1); load()">
          이전
        </button>

        <!-- 페이지 번호 (구글 스타일: 현재 페이지 강조) -->
        <div class="pagination-numbers">
          <span class="active">{{ page }}</span>
          <span class="muted">/ {{ totalPages }}</span>
        </div>

        <!-- 다음 버튼 -->
        <button class="pagination-arrow" :disabled="page >= totalPages" @click="page = Math.min(totalPages, page + 1); load()">
          다음
        </button>
      </div>
    </section>
  </main>
</template>