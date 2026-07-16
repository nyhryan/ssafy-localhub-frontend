<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBottomSheetDrag, SHEET_HEIGHT_MS } from "../composables/useBottomSheetDrag";
import { useMediaQuery } from "../composables/useMediaQuery";
import { getCategories, getPostCategories } from "../services/localhubApi";
import type { Place } from "../types/api";

interface KakaoMapWindow extends Window {
  kakao?: {
    maps: {
      load: (callback: () => void) => void;
      event: {
        addListener: (
          target: unknown,
          type: string,
          handler: () => void
        ) => void;
      };
      Map: new (
        container: HTMLElement,
        options: { center: unknown; level: number }
      ) => {
        setBounds: (bounds: unknown) => void;
        setCenter: (center: unknown) => void;
        relayout: () => void;
      };
      LatLng: new (latitude: number, longitude: number) => unknown;
      LatLngBounds: new () => {
        extend: (position: unknown) => void;
      };
      Marker: new (options: {
        map?: unknown;
        position: unknown;
        title?: string;
        image?: unknown;
      }) => {
        setMap: (map: unknown | null) => void;
        setImage: (image: unknown) => void;
      };
      MarkerImage: new (
        src: string,
        size: unknown,
        options?: { offset?: unknown; alt?: string }
      ) => unknown;
      Size: new (width: number, height: number) => unknown;
      Point: new (x: number, y: number) => unknown;
    };
  };
}

const MOBILE_QUERY = "(max-width: 720px)";
const PEEK_HEIGHT = 112;
const EXPANDED_RATIO = 0.62;

const route = useRoute();
const router = useRouter();
const isMobile = useMediaQuery(MOBILE_QUERY);

const places = ref<Place[]>([]);
const mapContainer = ref<HTMLElement | null>(null);
const mapInstance = shallowRef<{
  setBounds: (bounds: unknown) => void;
  setCenter: (center: unknown) => void;
  relayout: () => void;
} | null>(null);
const markerInstances = shallowRef<
  Array<{
    placeId: number | string;
    marker: {
      setMap: (map: unknown | null) => void;
      setImage: (image: unknown) => void;
    };
  }>
>([]);
const hoveredPlaceId = ref<number | string | null>(null);
const selectedPlaceId = ref<number | string | null>(null);
const currentFilter = ref("전체");
const currentPage = ref(1);
const totalPages = ref(1);
const categories = getPostCategories();
const mapError = ref("");
const expandedSheetHeight = ref(
  typeof window !== "undefined"
    ? Math.round(window.innerHeight * EXPANDED_RATIO)
    : 420
);

const relayoutMap = () => {
  mapInstance.value?.relayout();
};

const centerMapOnPlace = (place: Place) => {
  const kakaoWindow = window as KakaoMapWindow;
  const kakaoMaps = kakaoWindow.kakao?.maps;

  if (
    !mapInstance.value ||
    !kakaoMaps ||
    !place.mapy ||
    !place.mapx
  ) {
    return;
  }

  mapInstance.value.setCenter(
    new kakaoMaps.LatLng(Number(place.mapy), Number(place.mapx))
  );
};

const centerMapOnSelectedPlace = () => {
  const place = places.value.find(
    (item) => String(item.id) === String(selectedPlaceId.value)
  );
  if (place) {
    centerMapOnPlace(place);
  }
};

let relayoutTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleMapRelayout = () => {
  if (relayoutTimer !== null) {
    clearTimeout(relayoutTimer);
  }

  void nextTick(() => {
    if (relayoutTimer !== null) {
      clearTimeout(relayoutTimer);
    }

    relayoutTimer = setTimeout(() => {
      relayoutTimer = null;
      relayoutMap();
      centerMapOnSelectedPlace();
    }, SHEET_HEIGHT_MS + 16);
  });
};

const {
  snap: sheetSnap,
  sheetStyle,
  collapse: collapseSheet,
  syncHeightToSnap,
  onPointerDown: onSheetPointerDown,
  onPointerMove: onSheetPointerMove,
  onPointerUp: onSheetPointerUp,
} = useBottomSheetDrag({
  peekHeight: PEEK_HEIGHT,
  expandedHeight: expandedSheetHeight,
  onSnapChange: () => {
    scheduleMapRelayout();
  },
});

const selectedPlace = computed(
  () =>
    places.value.find(
      (place) => String(place.id) === String(selectedPlaceId.value)
    ) ?? null
);

const updateExpandedHeight = () => {
  expandedSheetHeight.value = Math.round(window.innerHeight * EXPANDED_RATIO);
  syncHeightToSnap();
};

const loadKakaoMap = () =>
  new Promise<void>((resolve, reject) => {
    const kakaoWindow = window as KakaoMapWindow;
    const apiKey = (import.meta.env.VITE_KAKAO_MAP_KEY || "").trim();

    if (!apiKey) {
      mapError.value =
        "카카오 지도 JavaScript 키가 설정되지 않았습니다. .env에 VITE_KAKAO_MAP_KEY를 넣어주세요.";
      reject(new Error(mapError.value));
      return;
    }

    const onKakaoReady = () => {
      if (!kakaoWindow.kakao?.maps) {
        mapError.value =
          "카카오 SDK가 로드되었지만 maps 객체를 찾지 못했습니다. 앱 키와 허용 도메인을 확인하세요.";
        reject(new Error(mapError.value));
        return;
      }

      kakaoWindow.kakao.maps.load(() => {
        resolve();
      });
    };

    if (kakaoWindow.kakao?.maps) {
      kakaoWindow.kakao.maps.load(() => resolve());
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-kakao-map-sdk="true"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", onKakaoReady, { once: true });
      existingScript.addEventListener(
        "error",
        () => {
          mapError.value = "카카오 지도 SDK 로딩에 실패했습니다.";
          reject(new Error(mapError.value));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.setAttribute("data-kakao-map-sdk", "true");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
    script.onload = onKakaoReady;
    script.onerror = () => {
      mapError.value = "카카오 지도 SDK 로딩에 실패했습니다.";
      reject(new Error(mapError.value));
    };

    document.head.appendChild(script);
  });

const initMap = () => {
  const kakaoWindow = window as KakaoMapWindow;
  const kakaoMaps = kakaoWindow.kakao?.maps;

  if (!mapContainer.value || !kakaoMaps) {
    return;
  }

  const center = new kakaoMaps.LatLng(37.5665, 126.978);
  mapInstance.value = new kakaoMaps.Map(mapContainer.value, {
    center,
    level: 10,
  });
};

const parsePage = (value: unknown) => {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
};

const syncFromRoute = () => {
  currentFilter.value =
    typeof route.query.filter === "string" && route.query.filter
      ? route.query.filter
      : "전체";
  currentPage.value = parsePage(route.query.page);
  selectedPlaceId.value =
    typeof route.query.placeId === "string" && route.query.placeId
      ? route.query.placeId
      : null;
};

const updateRouteQuery = async (next: {
  page?: number;
  filter?: string;
  placeId?: string | number | null;
}) => {
  const nextQuery: Record<string, string> = {};

  if (next.filter) nextQuery.filter = next.filter;
  if (next.page && next.page > 1) nextQuery.page = String(next.page);
  if (next.placeId !== null && next.placeId !== undefined)
    nextQuery.placeId = String(next.placeId);

  await router.replace({ query: nextQuery });
};

const clearMarkers = () => {
  markerInstances.value.forEach(({ marker }) => {
    marker.setMap(null);
  });
  markerInstances.value = [];
};

const createHoveredMarkerImage = (
  kakaoMaps: NonNullable<KakaoMapWindow["kakao"]>["maps"]
) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="12" fill="#ff5c5c" stroke="#ffffff" stroke-width="3" />
      <circle cx="16" cy="16" r="4" fill="#ffffff" />
    </svg>
  `;

  return new kakaoMaps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    new kakaoMaps.Size(32, 32),
    { offset: new kakaoMaps.Point(16, 16), alt: "hovered marker" }
  );
};

const refreshMarkerHighlights = () => {
  const kakaoWindow = window as KakaoMapWindow;
  const kakaoMaps = kakaoWindow.kakao?.maps;
  if (!kakaoMaps || !markerInstances.value.length) {
    return;
  }

  const defaultImage = new kakaoMaps.MarkerImage(
    "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
    new kakaoMaps.Size(24, 35)
  );
  const activeImage = createHoveredMarkerImage(kakaoMaps);

  markerInstances.value.forEach(({ placeId: markerPlaceId, marker }) => {
    const shouldHighlight =
      String(markerPlaceId) === String(hoveredPlaceId.value) ||
      String(markerPlaceId) === String(selectedPlaceId.value);
    marker.setImage(shouldHighlight ? activeImage : defaultImage);
  });
};

const setHoveredPlace = (placeId: number | string | null) => {
  hoveredPlaceId.value = placeId;
  refreshMarkerHighlights();
};

const resetHoveredPlace = () => {
  hoveredPlaceId.value = null;
  refreshMarkerHighlights();
};

const selectPlace = (placeId: number | string) => {
  selectedPlaceId.value = placeId;
  hoveredPlaceId.value = placeId;
  refreshMarkerHighlights();

  const targetPlace = places.value.find(
    (place) => String(place.id) === String(placeId)
  );

  if (isMobile.value) {
    collapseSheet();
    scheduleMapRelayout();
    return;
  }

  if (targetPlace) {
    centerMapOnPlace(targetPlace);
  }
};

const loadPlaces = async () => {
  syncFromRoute();

  const response = await getCategories({
    filter: currentFilter.value,
    page: currentPage.value,
  });

  places.value = response.places;
  totalPages.value = Math.max(1, response.pages.total_pages || 1);

  if (selectedPlaceId.value) {
    const matchedInCurrentPage = places.value.find(
      (place) => String(place.id) === String(selectedPlaceId.value)
    );

    if (!matchedInCurrentPage) {
      for (let page = 1; page <= totalPages.value; page += 1) {
        if (page === currentPage.value) continue;

        const pageResponse = await getCategories({
          filter: currentFilter.value,
          page,
        });

        const matchedPlace = pageResponse.places.find(
          (place) => String(place.id) === String(selectedPlaceId.value)
        );

        if (matchedPlace) {
          places.value = pageResponse.places;
          currentPage.value = page;
          break;
        }
      }
    }
  }

  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value;
    await loadPlaces();
  }
};

const setFilter = async (nextFilter: string) => {
  currentFilter.value = nextFilter;
  currentPage.value = 1;
  selectedPlaceId.value = null;
  await updateRouteQuery({
    filter: currentFilter.value,
    page: 1,
    placeId: null,
  });
  await loadPlaces();

  if (mapInstance.value) {
    drawMarkers();
  }
};

const goToPage = async (nextPage: number) => {
  if (nextPage < 1 || nextPage > totalPages.value) {
    return;
  }

  currentPage.value = nextPage;
  await updateRouteQuery({
    filter: currentFilter.value,
    page: currentPage.value,
    placeId: selectedPlaceId.value,
  });
  await loadPlaces();

  if (mapInstance.value) {
    drawMarkers();
  }
};

const isPlaceActive = (placeId: number | string) =>
  String(hoveredPlaceId.value) === String(placeId) ||
  String(selectedPlaceId.value) === String(placeId);

const drawMarkers = () => {
  const kakaoWindow = window as KakaoMapWindow;
  const kakaoMaps = kakaoWindow.kakao?.maps;

  if (!mapInstance.value || !kakaoMaps || !places.value.length) {
    return;
  }

  clearMarkers();

  const markerImage = new kakaoMaps.MarkerImage(
    "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
    new kakaoMaps.Size(24, 35)
  );

  const validPlaces = places.value.filter((place: Place) => {
    const latitude = Number(place.mapy);
    const longitude = Number(place.mapx);
    return Number.isFinite(latitude) && Number.isFinite(longitude);
  });

  if (!validPlaces.length) {
    mapError.value = "표시할 수 있는 장소 좌표가 없습니다.";
    return;
  }

  const bounds = new kakaoMaps.LatLngBounds();
  const firstPosition = new kakaoMaps.LatLng(
    Number(validPlaces[0].mapy),
    Number(validPlaces[0].mapx)
  );

  validPlaces.forEach((place: Place) => {
    const position = new kakaoMaps.LatLng(
      Number(place.mapy),
      Number(place.mapx)
    );
    bounds.extend(position);

    const marker = new kakaoMaps.Marker({
      map: mapInstance.value,
      position,
      title: place.title,
      image: markerImage,
    });

    marker.setMap(mapInstance.value);
    kakaoMaps.event.addListener(marker, "click", () => {
      selectPlace(place.id);
    });

    markerInstances.value.push({
      placeId: place.id,
      marker,
    });
  });

  const focusedPlace = validPlaces.find(
    (place) => String(place.id) === String(selectedPlaceId.value)
  );

  mapInstance.value.setBounds(bounds);
  if (focusedPlace) {
    mapInstance.value.setCenter(
      new kakaoMaps.LatLng(Number(focusedPlace.mapy), Number(focusedPlace.mapx))
    );
  } else {
    mapInstance.value.setCenter(firstPosition);
  }

  refreshMarkerHighlights();
};

watch(isMobile, async () => {
  if (!isMobile.value) {
    collapseSheet();
  }
  await nextTick();
  if (isMobile.value) {
    scheduleMapRelayout();
  } else {
    relayoutMap();
  }
});

onMounted(async () => {
  updateExpandedHeight();
  window.addEventListener("resize", updateExpandedHeight);

  try {
    await loadPlaces();
    await loadKakaoMap();
    initMap();
    drawMarkers();
    await nextTick();
    if (isMobile.value) {
      scheduleMapRelayout();
    } else {
      relayoutMap();
    }
  } catch (error) {
    mapError.value =
      error instanceof Error
        ? error.message
        : "지도를 불러오는데 실패했습니다.";
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", updateExpandedHeight);
  if (relayoutTimer !== null) {
    clearTimeout(relayoutTimer);
    relayoutTimer = null;
  }
});
</script>

<template>
  <main class="page">
    <section class="map-card" :class="{ 'map-card--mobile': isMobile }">
      <div class="section-head" :class="{ 'section-head--compact': isMobile }">
        <div>
          <h2>지역 명소 지도 시각화</h2>
          <p v-if="!isMobile" class="section-desc">
            카카오 지도 SDK로 실제 지도 위에 장소 마커를 표시합니다.
          </p>
        </div>
      </div>

      <div class="map-layout" :class="{ 'map-layout--mobile': isMobile }">
        <div class="map-stage">
          <div
            ref="mapContainer"
            class="map-canvas"
            :class="{ 'map-canvas--mobile': isMobile }"
            aria-label="카카오 지도 영역"
          ></div>

          <article
            v-if="isMobile && selectedPlace"
            class="selected-overlay"
          >
            <div class="badge">{{ selectedPlace.category_name }}</div>
            <strong class="selected-overlay__title">{{
              selectedPlace.title
            }}</strong>
            <p class="muted selected-overlay__meta">
              {{ selectedPlace.region }} · {{ selectedPlace.address }}
            </p>
          </article>
        </div>

        <aside
          class="map-panel"
          :class="{
            'map-panel--sheet': isMobile,
            'map-panel--expanded': isMobile && sheetSnap === 'expanded',
          }"
          :style="isMobile ? sheetStyle : undefined"
        >
          <template v-if="isMobile">
            <div
              class="sheet-drag-zone"
              @pointerdown="onSheetPointerDown"
              @pointermove="onSheetPointerMove"
              @pointerup="onSheetPointerUp"
              @pointercancel="onSheetPointerUp"
            >
              <div class="sheet-handle" aria-hidden="true"></div>
            </div>
            <div class="sheet-categories">
              <div class="filter-row filter-row--scroll">
                <button
                  v-for="item in categories"
                  :key="`mobile-${item}`"
                  type="button"
                  class="button-ghost"
                  :class="{ 'category-chip-active': currentFilter === item }"
                  @click="setFilter(item)"
                >
                  {{ item }}
                </button>
              </div>
            </div>
          </template>

          <div v-else class="filter-row">
            <button
              v-for="item in categories"
              :key="`desktop-${item}`"
              type="button"
              class="button-ghost"
              :class="{ 'category-chip-active': currentFilter === item }"
              @click="setFilter(item)"
            >
              {{ item }}
            </button>
          </div>

          <div
            class="panel-scroll"
            :class="{ 'panel-scroll--sheet': isMobile }"
          >
            <div
              class="places-grid"
              :class="{ 'places-grid--mobile': isMobile }"
            >
              <article
                v-for="place in places"
                :key="place.id"
                :class="['stat-card', { active: isPlaceActive(place.id) }]"
                @mouseenter="setHoveredPlace(place.id)"
                @mouseleave="resetHoveredPlace"
                @click="selectPlace(place.id)"
              >
                <div class="badge">{{ place.category_name }}</div>
                <strong class="place-title">{{ place.title }}</strong>
                <p class="muted place-meta">
                  {{ place.region }} · {{ place.address }}
                </p>
              </article>
            </div>

            <div class="pagination-container">
              <button
                class="pagination-arrow"
                :disabled="currentPage <= 1"
                @click="goToPage(Math.max(1, currentPage - 1))"
              >
                이전
              </button>

              <div class="pagination-numbers">
                <span class="active">{{ currentPage }}</span>
                <span class="muted">/ {{ totalPages }}</span>
              </div>

              <button
                class="pagination-arrow"
                :disabled="currentPage >= totalPages"
                @click="goToPage(Math.min(totalPages, currentPage + 1))"
              >
                다음
              </button>
            </div>

            <p v-if="mapError" class="muted">{{ mapError }}</p>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>

<style scoped>
.map-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.map-layout--mobile {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 12px;
  height: min(72vh, calc(100dvh - 168px));
  min-height: 420px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.map-card--mobile {
  padding-bottom: 12px;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

.section-head--compact h2 {
  font-size: 1.15rem;
}

.map-stage {
  position: relative;
  min-width: 0;
  height: 100%;
}

.map-layout--mobile .map-stage {
  flex: 1;
  min-height: 0;
}

.map-canvas {
  height: 100%;
}

.map-canvas--mobile {
  min-height: 0;
  border-radius: 18px;
}

.selected-overlay {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 2;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 107, 107, 0.28);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 28px rgba(32, 40, 74, 0.16);
  backdrop-filter: blur(8px);
  pointer-events: none;
}

.selected-overlay__title {
  display: block;
  margin-top: 4px;
}

.selected-overlay__meta {
  margin-top: 3px;
}

.map-panel {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.map-panel--sheet {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  /* Avoid overflow:hidden here — it blocks nested horizontal pan on the category row. */
  overflow: visible;
  border-radius: 18px 18px 12px 12px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -8px 28px rgba(32, 40, 74, 0.1);
}

.sheet-drag-zone {
  flex-shrink: 0;
  touch-action: none;
  padding: 10px 12px 4px;
  user-select: none;
}

.sheet-handle {
  width: 42px;
  height: 4px;
  margin: 0 auto;
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.35);
}

.sheet-categories {
  flex-shrink: 0;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  padding: 6px 12px 10px;
  box-sizing: border-box;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-row--scroll {
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding-bottom: 2px;
  touch-action: pan-x;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.filter-row--scroll::-webkit-scrollbar {
  display: none;
}

.filter-row--scroll .button-ghost {
  flex: 0 0 auto;
  white-space: nowrap;
}

.panel-scroll {
  display: grid;
  gap: 8px;
}

.panel-scroll--sheet {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 12px 12px;
  -webkit-overflow-scrolling: touch;
}

.map-panel--sheet:not(.map-panel--expanded) .panel-scroll--sheet {
  display: none;
}

.places-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.places-grid--mobile {
  grid-template-columns: 1fr;
}

.pagination-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
}

.pagination-arrow {
  min-width: 64px;
}

.pagination-numbers {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
}

.place-title {
  display: block;
  margin-top: 4px;
}

.place-meta {
  margin-top: 3px;
}

.stat-card {
  transition: transform 0.18s ease, border-color 0.18s ease,
    box-shadow 0.18s ease, background 0.18s ease;
  padding: 8px;
  border-radius: 6px;
}

.stat-card.active {
  border-color: #ff6b6b;
  background: linear-gradient(180deg, #fff7f7 0%, #fff 100%);
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.18);
  transform: translateY(-2px);
}
</style>
