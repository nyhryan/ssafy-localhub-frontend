<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import { getCategories } from '../services/localhubApi'
import type { Place } from '../types/api'

interface KakaoMapWindow extends Window {
  kakao?: {
    maps: {
      load: (callback: () => void) => void
      Map: new (
        container: HTMLElement,
        options: { center: unknown; level: number },
      ) => {
        setBounds: (bounds: unknown) => void
        setCenter: (center: unknown) => void
      }
      LatLng: new (latitude: number, longitude: number) => unknown
      LatLngBounds: new () => {
        extend: (position: unknown) => void
      }
      Marker: new (options: {
        map?: unknown
        position: unknown
        title?: string
        image?: unknown
      }) => {
        setMap: (map: unknown | null) => void
        setImage: (image: unknown) => void
      }
      MarkerImage: new (
        src: string,
        size: unknown,
        options?: { offset?: unknown; alt?: string },
      ) => unknown
      Size: new (width: number, height: number) => unknown
      Point: new (x: number, y: number) => unknown
    }
  }
}

const places = ref<Place[]>([])
const mapContainer = ref<HTMLElement | null>(null)
const mapInstance = shallowRef<{
  setBounds: (bounds: unknown) => void
  setCenter: (center: unknown) => void
} | null>(null)
const markerInstances = shallowRef<Array<{
  placeId: number | string
  marker: { setMap: (map: unknown | null) => void; setImage: (image: unknown) => void }
}>>([])
const hoveredPlaceId = ref<number | string | null>(null)
const mapError = ref('')

const loadKakaoMap = () => new Promise<void>((resolve, reject) => {
  const kakaoWindow = window as KakaoMapWindow
  const apiKey = (import.meta.env.VITE_KAKAO_MAP_KEY || '').trim()

  if (!apiKey) {
    mapError.value = '카카오 지도 JavaScript 키가 설정되지 않았습니다. .env에 VITE_KAKAO_MAP_KEY를 넣어주세요.'
    reject(new Error(mapError.value))
    return
  }

  const onKakaoReady = () => {
    if (!kakaoWindow.kakao?.maps) {
      mapError.value = '카카오 SDK가 로드되었지만 maps 객체를 찾지 못했습니다. 앱 키와 허용 도메인을 확인하세요.'
      reject(new Error(mapError.value))
      return
    }

    kakaoWindow.kakao.maps.load(() => {
      resolve()
    })
  }

  if (kakaoWindow.kakao?.maps) {
    kakaoWindow.kakao.maps.load(() => resolve())
    return
  }

  const existingScript = document.querySelector<HTMLScriptElement>('script[data-kakao-map-sdk="true"]')
  if (existingScript) {
    existingScript.addEventListener('load', onKakaoReady, { once: true })
    existingScript.addEventListener(
      'error',
      () => {
        mapError.value = '카카오 지도 SDK 로딩에 실패했습니다.'
        reject(new Error(mapError.value))
      },
      { once: true },
    )
    return
  }

  const script = document.createElement('script')
  script.async = true
  script.defer = true
  script.setAttribute('data-kakao-map-sdk', 'true')
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`
  script.onload = onKakaoReady
  script.onerror = () => {
    mapError.value = '카카오 지도 SDK 로딩에 실패했습니다.'
    reject(new Error(mapError.value))
  }

  document.head.appendChild(script)
})

const initMap = () => {
  const kakaoWindow = window as KakaoMapWindow
  const kakaoMaps = kakaoWindow.kakao?.maps

  if (!mapContainer.value || !kakaoMaps) {
    return
  }

  const center = new kakaoMaps.LatLng(37.5665, 126.9780)
  mapInstance.value = new kakaoMaps.Map(mapContainer.value, {
    center,
    level: 10,
  })
}

const clearMarkers = () => {
  markerInstances.value.forEach(({ marker }) => {
    marker.setMap(null)
  })
  markerInstances.value = []
}

const createHoveredMarkerImage = (kakaoMaps: KakaoMapWindow['kakao']['maps']) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="12" fill="#ff5c5c" stroke="#ffffff" stroke-width="3" />
      <circle cx="16" cy="16" r="4" fill="#ffffff" />
    </svg>
  `

  return new kakaoMaps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    new kakaoMaps.Size(32, 32),
    { offset: new kakaoMaps.Point(16, 16), alt: 'hovered marker' },
  )
}

const setHoveredPlace = (placeId: number | string | null) => {
  hoveredPlaceId.value = placeId

  const kakaoWindow = window as KakaoMapWindow
  const kakaoMaps = kakaoWindow.kakao?.maps
  if (!kakaoMaps || !markerInstances.value.length) {
    return
  }

  const defaultImage = new kakaoMaps.MarkerImage(
    'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
    new kakaoMaps.Size(24, 35),
  )
  const activeImage = createHoveredMarkerImage(kakaoMaps)

  markerInstances.value.forEach(({ placeId: markerPlaceId, marker }) => {
    const shouldHighlight = markerPlaceId === placeId
    marker.setImage(shouldHighlight ? activeImage : defaultImage)
  })
}

const resetHoveredPlace = () => {
  hoveredPlaceId.value = null
  const kakaoWindow = window as KakaoMapWindow
  const kakaoMaps = kakaoWindow.kakao?.maps
  if (!kakaoMaps || !markerInstances.value.length) {
    return
  }

  const defaultImage = new kakaoMaps.MarkerImage(
    'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
    new kakaoMaps.Size(24, 35),
  )

  markerInstances.value.forEach(({ marker }) => {
    marker.setImage(defaultImage)
  })
}

const drawMarkers = () => {
  const kakaoWindow = window as KakaoMapWindow
  const kakaoMaps = kakaoWindow.kakao?.maps

  if (!mapInstance.value || !kakaoMaps || !places.value.length) {
    return
  }

  clearMarkers()

  const markerImage = new kakaoMaps.MarkerImage(
    'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
    new kakaoMaps.Size(24, 35),
  )

  const validPlaces = places.value.filter((place: Place) => {
    const latitude = Number(place.mapy)
    const longitude = Number(place.mapx)
    return Number.isFinite(latitude) && Number.isFinite(longitude)
  })

  if (!validPlaces.length) {
    mapError.value = '표시할 수 있는 장소 좌표가 없습니다.'
    return
  }

  const bounds = new kakaoMaps.LatLngBounds()
  const firstPosition = new kakaoMaps.LatLng(Number(validPlaces[0].mapy), Number(validPlaces[0].mapx))

  validPlaces.forEach((place: Place) => {
    const position = new kakaoMaps.LatLng(Number(place.mapy), Number(place.mapx))
    bounds.extend(position)

    const marker = new kakaoMaps.Marker({
      map: mapInstance.value,
      position,
      title: place.title,
      image: markerImage,
    })

    marker.setMap(mapInstance.value)
    markerInstances.value.push({
      placeId: place.id,
      marker,
    })
  })

  mapInstance.value.setBounds(bounds)
  mapInstance.value.setCenter(firstPosition)
}

onMounted(async () => {
  try {
    const response = await getCategories({ filter: '전체', page: 1 })
    places.value = response.places

    await loadKakaoMap()
    initMap()
    drawMarkers()
  } catch (error) {
    mapError.value = error instanceof Error ? error.message : '지도를 불러오는데 실패했습니다.'
  }
})
</script>

<template>
  <main class="page">
    <section class="map-card">
      <div class="section-head">
        <div>
          <h2>지역 명소 지도 시각화</h2>
          <p class="section-desc">카카오 지도 SDK로 실제 지도 위에 장소 마커를 표시합니다.</p>
        </div>
        <span class="status-pill">Kakao Map</span>
      </div>

      <div class="grid-2" style="margin-top: 18px">
        <div ref="mapContainer" class="map-canvas" aria-label="카카오 지도 영역"></div>

        <div class="map-legend">
          <article
            v-for="place in places"
            :key="place.id"
            :class="['stat-card', { active: hoveredPlaceId === place.id }]"
            @mouseenter="setHoveredPlace(place.id)"
            @mouseleave="resetHoveredPlace"
          >
            <div class="badge">{{ place.category_name }}</div>
            <strong style="display: block; margin-top: 8px">{{
              place.title
            }}</strong>
            <p class="muted" style="margin-top: 6px">
              {{ place.region }} · {{ place.address }}
            </p>
          </article>

          <p v-if="mapError" class="muted">{{ mapError }}</p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.map-legend {
  display: grid;
  gap: 12px;
}

.stat-card {
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.stat-card.active {
  border-color: #ff6b6b;
  background: linear-gradient(180deg, #fff7f7 0%, #fff 100%);
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.18);
  transform: translateY(-2px);
}
</style>
