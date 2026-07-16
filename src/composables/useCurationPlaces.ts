import { computed, type Ref } from 'vue'
import { useInfiniteQuery } from '@tanstack/vue-query'
import { getCategories } from '../services/localhubApi'
import type { Place } from '../types/api'

export function useCurationPlaces(filter: Ref<string> | (() => string)) {
  const filterValue = computed(() =>
    typeof filter === 'function' ? filter() : filter.value,
  )

  const query = useInfiniteQuery({
    queryKey: computed(() => ['categories', filterValue.value] as const),
    queryFn: ({ pageParam }) =>
      getCategories({
        filter: filterValue.value,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const current = lastPage.pages.current_page
      const total = Math.max(1, lastPage.pages.total_pages || 1)
      return current < total ? current + 1 : undefined
    },
  })

  const places = computed<Place[]>(() => {
    const pages = query.data.value?.pages
    if (!pages?.length) return []

    const seen = new Set<Place['id']>()
    const items: Place[] = []
    for (const page of pages) {
      for (const place of page.places) {
        if (seen.has(place.id)) continue
        seen.add(place.id)
        items.push(place)
      }
    }
    return items
  })

  return {
    ...query,
    places,
  }
}
