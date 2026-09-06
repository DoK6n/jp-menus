import type { PullToRefreshPhase } from "../pull-to-refresh";

interface PullToRefreshIndicatorProps {
  distance: number;
  phase: PullToRefreshPhase;
  threshold: number;
}

export function PullToRefreshIndicator(props: PullToRefreshIndicatorProps) {
  const progress = () => Math.min(props.distance / props.threshold, 1);
  const label = () => {
    if (props.phase === "ready") return "놓으면 새로고침";
    if (props.phase === "refreshing") return "새로고침 중";
    return "아래로 당겨 새로고침";
  };

  return (
    <div
      class="pull-refresh-indicator pointer-events-none fixed left-1/2 z-40 grid size-10 place-items-center rounded-full border border-line bg-surface text-accent shadow-md"
      data-pull-refresh
      data-state={props.phase}
      role="status"
      aria-hidden={props.phase === "idle"}
      aria-live="polite"
      style={{
        opacity: String(Math.min(props.distance / 24, 1)),
        top: "env(safe-area-inset-top)",
        transform: `translate3d(-50%, ${props.distance - 48}px, 0)`,
      }}
    >
      <svg
        class="size-5"
        classList={{ "animate-spin": props.phase === "refreshing" }}
        style={{ transform: props.phase === "refreshing" ? undefined : `rotate(${progress() * 180}deg)` }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6v5h-5" />
        <path d="M19 11a7 7 0 1 0 .1 3" />
      </svg>
      <span class="sr-only">{label()}</span>
    </div>
  );
}
