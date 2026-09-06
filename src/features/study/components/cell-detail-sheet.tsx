import { Show } from "solid-js";

import { useStudyState } from "../state";

export function CellDetailSheet() {
  const state = useStudyState();

  return (
    <Show when={state.cellDetail()} keyed>
      {(detail) => (
        <div class="fixed inset-y-0 left-1/2 z-50 flex w-full max-w-[480px] -translate-x-1/2 items-end">
          <button
            type="button"
            class="absolute inset-0 cursor-default bg-ink/30 backdrop-blur-[1px]"
            aria-label="전체 내용 닫기"
            onClick={() => state.closeCellDetail()}
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
                {detail.label}
              </p>
              <button
                type="button"
                class="flex size-11 shrink-0 items-center justify-center rounded-full bg-paper text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="닫기"
                onClick={() => state.closeCellDetail()}
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
            <p class="mt-4 text-[24px] leading-[1.45] font-bold tracking-[-0.025em] break-keep text-ink">
              {detail.value}
            </p>
          </section>
        </div>
      )}
    </Show>
  );
}
