import { onCleanup, Show } from "solid-js";

import type { CellDetail } from "../model";
import { useStudyState } from "../state";
import { CopyValue } from "./copy-value";
import { KanjiDetail } from "./kanji-detail";

export function CellDetailSheet() {
  const state = useStudyState();

  return (
    <Show when={state.cellDetail()} keyed>
      {(detail) => <CellDetailContent detail={detail} onClose={() => state.closeCellDetail()} />}
    </Show>
  );
}

function CellDetailContent(props: { detail: CellDetail; onClose: () => void }) {
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  let dialog: HTMLElement | undefined;
  const isKanji = () => Boolean(props.detail.kanji);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      props.onClose();
    } else if (event.key === "Tab") {
      // Closed component branches must not enter the focus loop.
      const controls = [...(dialog?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], summary, [tabindex]:not([tabindex="-1"])',
      ) ?? [])].filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };

  onCleanup(() => {
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  });

  return (
    <div class="fixed inset-y-0 left-1/2 z-50 flex w-full max-w-[480px] -translate-x-1/2 items-end">
      <Show when={!isKanji()}>
        <button
          type="button"
          class="absolute inset-0 cursor-default bg-ink/30 backdrop-blur-[1px]"
          aria-label="전체 내용 닫기"
          onClick={props.onClose}
        />
      </Show>
      <section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cell-detail-title"
        onKeyDown={handleKeyDown}
        class="relative z-10 flex w-full flex-col bg-surface shadow-[0_-16px_40px_rgba(32,32,30,0.16)]"
        classList={{ "h-dvh": isKanji(), "max-h-[85dvh] rounded-t-[28px]": !isKanji() }}
      >
        <div
          class="flex shrink-0 items-center justify-between gap-4 px-5 pb-3"
          classList={{ "border-b border-line pt-[max(0.75rem,env(safe-area-inset-top))]": isKanji(), "pt-5": !isKanji() }}
        >
          <h2 id="cell-detail-title" class="text-sm font-bold text-accent">
            {props.detail.kanji ? `${props.detail.kanji.item.term} 한자 상세` : props.detail.label}
          </h2>
          <button
            type="button"
            class="flex size-11 shrink-0 items-center justify-center rounded-full bg-paper text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="닫기"
            onClick={props.onClose}
          >
            <svg class="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m4 4 12 12M16 4 4 16" />
            </svg>
          </button>
        </div>
        <div
          class="min-h-0 overflow-y-auto overscroll-y-contain px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          data-kanji-detail-body={isKanji() ? "" : undefined}
        >
          <Show when={props.detail.kanji} fallback={<CopyValue value={props.detail.value} autofocus />}>
            {(kanji) => <KanjiDetail item={kanji().item} selectedColumn={kanji().column} />}
          </Show>
        </div>
      </section>
    </div>
  );
}
