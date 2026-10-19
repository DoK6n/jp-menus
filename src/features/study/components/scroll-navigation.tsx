import { createEffect, createSignal, onCleanup, onMount, type Accessor } from "solid-js";

import { catalogById } from "../../../data/catalogs";
import { useStudyState } from "../state";

interface ScrollNavigationProps {
  scrollElement: Accessor<HTMLElement | undefined>;
  contentElement: Accessor<HTMLElement | undefined>;
}

export function ScrollNavigation(props: ScrollNavigationProps) {
  const state = useStudyState();
  const [canScrollUp, setCanScrollUp] = createSignal(false);
  const [canScrollDown, setCanScrollDown] = createSignal(false);
  let pendingJump: number | undefined;
  let topButton: HTMLButtonElement | undefined;
  let bottomButton: HTMLButtonElement | undefined;

  const updatePosition = () => {
    const element = props.scrollElement();
    const catalog = catalogById(state.selectedCatalog());
    const hasMore = Boolean(catalog && state.hasMoreItems(catalog));
    if (!element) return;
    setCanScrollUp(element.scrollTop > 1);
    setCanScrollDown(hasMore || element.scrollHeight - element.clientHeight - element.scrollTop > 1);
  };

  const cancelJump = () => {
    if (pendingJump !== undefined) window.cancelAnimationFrame(pendingJump);
    pendingJump = undefined;
  };

  const listKey = () => JSON.stringify([
    state.selectedCatalog(), state.selectedCategory(), state.query(), state.hideMastered(),
  ]);

  const goToTop = () => {
    cancelJump();
    const returnFocus = document.activeElement === topButton;
    props.scrollElement()?.scrollTo({ top: 0, behavior: "instant" });
    updatePosition();
    if (returnFocus) bottomButton?.focus({ preventScroll: true });
  };

  const goToBottom = () => {
    const catalog = catalogById(state.selectedCatalog());
    if (!catalog) return;
    cancelJump();
    const key = listKey();
    const returnFocus = document.activeElement === bottomButton;
    state.showAllItems(catalog);
    // Wait for the full filtered list to be laid out before measuring its end.
    pendingJump = window.requestAnimationFrame(() => {
      pendingJump = undefined;
      const element = props.scrollElement();
      if (!element || key !== listKey() || state.cellDetail()) return;
      element.scrollTo({ top: element.scrollHeight, behavior: "instant" });
      updatePosition();
      if (returnFocus) topButton?.focus({ preventScroll: true });
    });
  };

  createEffect(updatePosition);

  onMount(() => {
    const element = props.scrollElement();
    const content = props.contentElement();
    if (!element || !content) return;
    const observer = new ResizeObserver(updatePosition);
    observer.observe(element);
    observer.observe(content);
    element.addEventListener("scroll", updatePosition, { passive: true });
    updatePosition();

    onCleanup(() => {
      observer.disconnect();
      element.removeEventListener("scroll", updatePosition);
    });
  });

  onCleanup(cancelJump);

  return (
    <nav
      aria-label="페이지 이동"
      aria-hidden={Boolean(state.cellDetail())}
      inert={Boolean(state.cellDetail())}
      class="flex shrink-0 justify-end gap-2 border-t border-line bg-surface px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-5"
      classList={{ invisible: Boolean(state.cellDetail()) }}
    >
      <button
        ref={topButton}
        type="button"
        aria-label="맨 위로 이동"
        aria-controls="study-scroll"
        title="맨 위로 이동"
        disabled={!canScrollUp()}
        onClick={goToTop}
        class="grid size-11 place-items-center rounded-full border border-line bg-paper text-accent outline-none hover:bg-accent-soft active:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-paper"
      >
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 4h14M12 20V8m-5 5 5-5 5 5" />
        </svg>
      </button>
      <button
        ref={bottomButton}
        type="button"
        aria-label="맨 아래로 이동"
        aria-controls="study-scroll"
        title="맨 아래로 이동"
        disabled={!canScrollDown()}
        onClick={goToBottom}
        class="grid size-11 place-items-center rounded-full border border-line bg-paper text-accent outline-none hover:bg-accent-soft active:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-paper"
      >
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 20h14M12 4v12m-5-5 5 5 5-5" />
        </svg>
      </button>
    </nav>
  );
}
