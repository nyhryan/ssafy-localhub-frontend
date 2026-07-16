<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import PlaceCard from '../components/PlaceCard.vue'
import { useCurationPlaces } from '../composables/useCurationPlaces'
import { getPostCategories } from '../services/localhubApi'
import type { Place } from '../types/api'

const props = defineProps<{ mode?: 'all' }>()

const route = useRoute()
const router = useRouter()
const categories = getPostCategories()
const sentinelRef = ref<HTMLElement | null>(null)

const filter = computed(() =>
  typeof route.query.filter === 'string' && route.query.filter
    ? route.query.filter
    : '전체',
)

const {
  places,
  fetchNextPage,
  hasNextPage,
  isPending,
  isFetchingNextPage,
  isError,
  error,
} = useCurationPlaces(filter)

const title = computed(() =>
  props.mode === 'all' ? '큐레이션 - 전체보기' : '큐레이션 - 카테고리 골라보기',
)

const showLoader = computed(
  () => isPending.value || isFetchingNextPage.value,
)

const buildQuery = (nextFilter: string) => {
  const nextQuery: Record<string, string> = {}
  if (nextFilter && nextFilter !== '전체') nextQuery.filter = nextFilter
  return nextQuery
}

const sameQuery = (nextQuery: Record<string, string>) => {
  const current = route.query
  const keys = new Set([...Object.keys(nextQuery), ...Object.keys(current)])
  for (const key of keys) {
    const currentValue = current[key]
    const nextValue = nextQuery[key]
    if ((Array.isArray(currentValue) ? currentValue[0] : currentValue) !== (nextValue ?? undefined)) {
      return false
    }
  }
  return true
}

const updateRouteQuery = (nextFilter: string) => {
  const nextQuery = buildQuery(nextFilter)
  if (sameQuery(nextQuery)) return
  router.push({ query: nextQuery })
}

const setFilter = (nextFilter: string) => {
  window.scrollTo({ top: 0, behavior: 'auto' })
  updateRouteQuery(nextFilter)
}

const goToMap = (place: Place) => {
  const nextQuery: Record<string, string> = {
    placeId: String(place.id),
  }

  if (place.category_name && place.category_name !== '전체') {
    nextQuery.filter = place.category_name
  }

  router.push({ path: '/map', query: nextQuery })
}

// Drop legacy ?page= from the URL once (infinite scroll no longer uses it).
watch(
  () => route.query.page,
  (page) => {
    if (page === undefined) return
    const nextQuery = buildQuery(filter.value)
    if (!sameQuery(nextQuery)) {
      router.replace({ query: nextQuery })
    }
  },
  { immediate: true },
)

let observer: IntersectionObserver | null = null

const disconnectObserver = () => {
  observer?.disconnect()
  observer = null
}

watch(
  sentinelRef,
  (el) => {
    disconnectObserver()
    if (!el) return

    observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        if (!hasNextPage.value || isFetchingNextPage.value) return
        void fetchNextPage()
      },
      { rootMargin: '240px 0px' },
    )
    observer.observe(el)
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  disconnectObserver()
})
</script>

<template>
  <main class="page">
    <section class="surface">
      <div class="section-head">
        <div>
          <h2>{{ title }}</h2>
          <p class="section-desc">장소 카드와 카테고리 필터로 지역 데이터를 탐색합니다.</p>
        </div>
      </div>

      <div class="filter-row" style="margin-top: 18px">
        <button
          v-for="item in categories"
          :key="item"
          type="button"
          class="button-ghost"
          :class="{ 'category-chip-active': filter === item }"
          @click="setFilter(item)"
        >
          {{ item }}
        </button>
      </div>
    </section>

    <section class="grid-2">
      <div
        v-for="place in places"
        :key="place.id"
        style="cursor: pointer"
        @click="goToMap(place)"
      >
        <PlaceCard :place="place" />
      </div>
    </section>

    <p v-if="isError" class="curation-status muted">
      {{ error?.message || '장소 목록을 불러오지 못했습니다.' }}
    </p>

    <div ref="sentinelRef" class="curation-sentinel" aria-hidden="true">
      <Loader2 v-if="showLoader" class="curation-loader" :size="28" />
    </div>
  </main>
</template>

<style scoped>
.curation-sentinel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  padding: 12px 0 24px;
}

.curation-loader {
  color: var(--text-muted, #6b7280);
  animation: curation-spin 0.8s linear infinite;
}

.curation-status {
  text-align: center;
  padding: 12px 0;
}

@keyframes curation-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
