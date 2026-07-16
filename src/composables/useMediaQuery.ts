import { onMounted, onUnmounted, ref } from "vue";

export function useMediaQuery(query: string) {
  const matches = ref(
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );
  let mediaQuery: MediaQueryList | null = null;

  const update = () => {
    if (mediaQuery) {
      matches.value = mediaQuery.matches;
    }
  };

  onMounted(() => {
    mediaQuery = window.matchMedia(query);
    update();
    mediaQuery.addEventListener("change", update);
  });

  onUnmounted(() => {
    mediaQuery?.removeEventListener("change", update);
  });

  return matches;
}
