<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getCategories } from '../services/localhubApi'
import type { Place } from '../types/api'

const places = ref<Place[]>([])

const toPinStyle = (place: Place) => {
  const left = ((place.mapx % 1) * 72) + 12
  const top = ((place.mapy % 1) * 72) + 12
  return {
    left: `${Math.min(80, Math.max(8, left))}%`,
    top: `${Math.min(80, Math.max(8, top))}%`,
  }
}

onMounted(async () => {
  const response = await getCategories({ filter: '전체', pageSize: 6 })
  places.value = response.places
})
</script>

<template>
  <main class="page">
    <section class="map-card">
      <div class="section-head">
        <div>
          <h2>지역 명소 지도 시각화</h2>
          <p class="section-desc">좌표가 있는 장소 데이터를 먼저 보여주는 가벼운 지도형 화면입니다.</p>
        </div>
        <span class="status-pill">Map Mock</span>
      </div>

      <div class="grid-2" style="margin-top: 18px">
        <div class="map-canvas">
          <button v-for="place in places" :key="place.id" type="button" class="map-pin" :style="toPinStyle(place)">{{ place.id }}</button>
        </div>

        <div class="map-legend">
          <article v-for="place in places" :key="place.id" class="stat-card">
            <div class="badge">{{ place.category }}</div>
            <strong style="display: block; margin-top: 8px">{{ place.title }}</strong>
            <p class="muted" style="margin-top: 6px">{{ place.region }} · {{ place.address }}</p>
          </article>
        </div>
      </div>
    </section>
  </main>
</template>