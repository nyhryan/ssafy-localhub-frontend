<script setup lang="ts">
import { computed } from "vue";
import type { Place } from "../types/api";

const props = defineProps<{
  place: Place;
}>();

// Fallback 이미지
const fallbackImage = new URL("../assets/fallback.png", import.meta.url).href;

// 이미지 결정
const displayImage = computed(() => {
  return props.place.image && props.place.image.trim()
    ? props.place.image
    : fallbackImage;
});
</script>

<template>
  <article class="place-card">
    <img
      :src="displayImage"
      :alt="place.title"
      style="height: 180px; width: 100%; object-fit: cover; border-radius: 18px"
    />
    <span class="badge">{{ place.category_name }}</span>
    <h3 class="place-title">{{ place.title }}</h3>
    <p class="muted">{{ place.address }}</p>
    <p>{{ place.description }}</p>
  </article>
</template>
