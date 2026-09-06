import { createMemo, createSignal, onCleanup, onMount, type Accessor } from "solid-js";

export type PullToRefreshPhase = "idle" | "pulling" | "ready" | "refreshing";

const REFRESH_THRESHOLD = 72;
const MAX_PULL_DISTANCE = 112;
const PULL_RESISTANCE = 0.62;
const REFRESH_DELAY_MS = 420;

export function createPullToRefresh(scrollElement: Accessor<HTMLElement | undefined>) {
  const [pullDistance, setPullDistance] = createSignal(0);
  const [refreshing, setRefreshing] = createSignal(false);

  let startX = 0;
  let startY = 0;
  let tracking = false;
  let refreshTimer: number | undefined;

  const phase = createMemo<PullToRefreshPhase>(() => {
    if (refreshing()) return "refreshing";
    if (pullDistance() >= REFRESH_THRESHOLD) return "ready";
    if (pullDistance() > 0) return "pulling";
    return "idle";
  });

  onMount(() => {
    const element = scrollElement();
    if (!element) return;

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (
        !touch ||
        event.touches.length !== 1 ||
        refreshing() ||
        element.scrollTop > 0 ||
        element.dataset.detailOpen === "true"
      ) {
        tracking = false;
        return;
      }

      tracking = true;
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!tracking || !touch || event.touches.length !== 1 || refreshing()) return;

      if (element.scrollTop > 0) {
        tracking = false;
        setPullDistance(0);
        return;
      }

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      if (deltaY <= 0) {
        setPullDistance(0);
        return;
      }

      if (Math.abs(deltaX) > deltaY) {
        tracking = false;
        setPullDistance(0);
        return;
      }

      if (event.cancelable) event.preventDefault();
      setPullDistance(Math.min(MAX_PULL_DISTANCE, deltaY * PULL_RESISTANCE));
    };

    const finishPull = () => {
      if (!tracking || refreshing()) return;
      tracking = false;

      if (pullDistance() < REFRESH_THRESHOLD) {
        setPullDistance(0);
        return;
      }

      setRefreshing(true);
      setPullDistance(REFRESH_THRESHOLD);
      refreshTimer = window.setTimeout(() => window.location.reload(), REFRESH_DELAY_MS);
    };

    const cancelPull = () => {
      tracking = false;
      if (!refreshing()) setPullDistance(0);
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", finishPull, { passive: true });
    element.addEventListener("touchcancel", cancelPull, { passive: true });

    onCleanup(() => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", finishPull);
      element.removeEventListener("touchcancel", cancelPull);
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
    });
  });

  return {
    phase,
    pullDistance,
    threshold: REFRESH_THRESHOLD,
  };
}
