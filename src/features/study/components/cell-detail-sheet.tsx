import { createSignal, onCleanup, Show } from "solid-js";

import type { CellDetail } from "../model";
import { useStudyState } from "../state";

type CopyState = "idle" | "copied" | "failed";

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through for browsers or installed web apps that deny Clipboard API access.
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.inset = "0 auto auto -9999px";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();
  textArea.setSelectionRange(0, value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textArea.remove();
  }
}

export function CellDetailSheet() {
  const state = useStudyState();

  return (
    <Show when={state.cellDetail()} keyed>
      {(detail) => <CellDetailContent detail={detail} onClose={() => state.closeCellDetail()} />}
    </Show>
  );
}

function CellDetailContent(props: { detail: CellDetail; onClose: () => void }) {
  const [copyState, setCopyState] = createSignal<CopyState>("idle");
  let resetTimer: number | undefined;

  const handleCopy = async () => {
    const copied = await copyToClipboard(props.detail.value);
    setCopyState(copied ? "copied" : "failed");
    if (resetTimer !== undefined) window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => setCopyState("idle"), 1600);
  };

  onCleanup(() => {
    if (resetTimer !== undefined) window.clearTimeout(resetTimer);
  });

  const copyLabel = () => {
    if (copyState() === "copied") return "복사됨";
    if (copyState() === "failed") return "복사 실패";
    return "복사";
  };

  return (
    <div class="fixed inset-y-0 left-1/2 z-50 flex w-full max-w-[480px] -translate-x-1/2 items-end">
      <button
        type="button"
        class="absolute inset-0 cursor-default bg-ink/30 backdrop-blur-[1px]"
        aria-label="전체 내용 닫기"
        onClick={props.onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cell-detail-title"
        class="relative z-10 w-full rounded-t-[28px] bg-surface px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-16px_40px_rgba(32,32,30,0.16)]"
      >
        <div class="flex items-center justify-between gap-4">
          <p
            id="cell-detail-title"
            class="text-xs font-bold tracking-[0.08em] text-accent"
          >
            {props.detail.label}
          </p>
          <button
            type="button"
            class="flex size-11 shrink-0 items-center justify-center rounded-full bg-paper text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="닫기"
            onClick={props.onClose}
          >
            <svg
              class="size-5"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path d="m4 4 12 12M16 4 4 16" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          class="group mt-3 flex min-h-14 w-full items-start justify-between gap-3 rounded-xl px-2 py-2 text-left outline-none transition-colors hover:bg-paper active:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={`${props.detail.value} 복사`}
          onClick={handleCopy}
        >
          <span class="text-[24px] leading-[1.45] font-bold tracking-[-0.025em] break-keep text-ink">
            {props.detail.value}
          </span>
          <span
            class="mt-1 flex min-h-8 shrink-0 items-center gap-1.5 rounded-full bg-paper px-2.5 text-xs font-bold text-muted group-active:text-accent"
            aria-hidden="true"
          >
            <Show
              when={copyState() === "copied"}
              fallback={
                <svg
                  class="size-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  aria-hidden="true"
                >
                  <rect x="6.5" y="6.5" width="9" height="9" rx="1.5" />
                  <path d="M13.5 6.5V5A1.5 1.5 0 0 0 12 3.5H5A1.5 1.5 0 0 0 3.5 5v7A1.5 1.5 0 0 0 5 13.5h1.5" />
                </svg>
              }
            >
              <svg
                class="size-4 text-accent"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m4 10 4 4 8-8" />
              </svg>
            </Show>
            {copyLabel()}
          </span>
        </button>
        <p class="sr-only" role="status" aria-live="polite">
          {copyState() === "copied"
            ? `${props.detail.value} 복사됨`
            : copyState() === "failed"
              ? "클립보드에 복사하지 못했습니다"
              : ""}
        </p>
      </section>
    </div>
  );
}
