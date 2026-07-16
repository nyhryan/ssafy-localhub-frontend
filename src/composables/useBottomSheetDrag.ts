import { computed, onUnmounted, ref, type Ref } from "vue";

export type SheetSnap = "peek" | "expanded";

/** Keep in sync with sheet height CSS transition. */
export const SHEET_HEIGHT_MS = 280;

type HeightSource = number | Ref<number> | (() => number);

const resolveHeight = (source: HeightSource) => {
  if (typeof source === "function") return source();
  if (typeof source === "object" && source !== null && "value" in source) {
    return source.value;
  }
  return source;
};

export function useBottomSheetDrag(options: {
  peekHeight: HeightSource;
  expandedHeight: HeightSource;
  onSnapChange?: (snap: SheetSnap) => void;
}) {
  const snap = ref<SheetSnap>("peek");
  const isDragging = ref(false);
  const height = ref(resolveHeight(options.peekHeight));

  let startY = 0;
  let startHeight = 0;
  let lastY = 0;
  let lastTime = 0;
  let velocity = 0;
  let activePointerId: number | null = null;

  const peek = () => resolveHeight(options.peekHeight);
  const expanded = () => resolveHeight(options.expandedHeight);

  const clampHeight = (value: number) => {
    const min = peek();
    const max = Math.max(min, expanded());
    return Math.min(max, Math.max(min, value));
  };

  const applySnap = (next: SheetSnap) => {
    snap.value = next;
    height.value = next === "expanded" ? expanded() : peek();
    options.onSnapChange?.(next);
  };

  const collapse = () => {
    isDragging.value = false;
    activePointerId = null;
    applySnap("peek");
  };

  const syncHeightToSnap = () => {
    if (isDragging.value) return;
    height.value = snap.value === "expanded" ? expanded() : peek();
  };

  const sheetStyle = computed(() => ({
    height: `${height.value}px`,
    transition: isDragging.value ? "none" : `height ${SHEET_HEIGHT_MS}ms ease`,
  }));

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;

    const target = event.currentTarget as HTMLElement | null;
    if (!target) return;

    isDragging.value = true;
    activePointerId = event.pointerId;
    startY = event.clientY;
    startHeight = height.value;
    lastY = event.clientY;
    lastTime = performance.now();
    velocity = 0;

    target.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!isDragging.value || event.pointerId !== activePointerId) return;

    const now = performance.now();
    const dt = now - lastTime;
    if (dt > 0) {
      velocity = (lastY - event.clientY) / dt;
    }
    lastY = event.clientY;
    lastTime = now;

    const delta = startY - event.clientY;
    height.value = clampHeight(startHeight + delta);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!isDragging.value || event.pointerId !== activePointerId) return;

    isDragging.value = false;
    activePointerId = null;

    const min = peek();
    const max = Math.max(min, expanded());
    const mid = (min + max) / 2;

    if (velocity > 0.45) {
      applySnap("expanded");
    } else if (velocity < -0.45) {
      applySnap("peek");
    } else {
      applySnap(height.value >= mid ? "expanded" : "peek");
    }
  };

  onUnmounted(() => {
    isDragging.value = false;
    activePointerId = null;
  });

  return {
    snap,
    height,
    isDragging,
    sheetStyle,
    collapse,
    syncHeightToSnap,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
