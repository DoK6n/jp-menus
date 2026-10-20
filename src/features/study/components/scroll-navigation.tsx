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
  const hidden = () => Boolean(state.cellDetail()) || (!canScrollUp() && !canScrollDown());
  const label = () => canScrollDown() ? "맨 아래로 이동" : "맨 위로 이동";

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
    props.scrollElement()?.scrollTo({ top: 0, behavior: "instant" });
    updatePosition();
  };

  const goToBottom = () => {
    const catalog = catalogById(state.selectedCatalog());
    if (!catalog) return;
    cancelJump();
    const key = listKey();
    state.showAllItems(catalog);
    // Wait for the full filtered list to be laid out before measuring its end.
    pendingJump = window.requestAnimationFrame(() => {
      pendingJump = undefined;
      const element = props.scrollElement();
      if (!element || key !== listKey() || state.cellDetail()) return;
      element.scrollTo({ top: element.scrollHeight, behavior: "instant" });
      updatePosition();
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
      aria-hidden={hidden()}
      inert={hidden()}
      class="absolute right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-30"
      classList={{ invisible: hidden() }}
    >
      <button
        type="button"
        aria-label={label()}
        aria-controls="study-scroll"
        title={label()}
        onClick={() => canScrollDown() ? goToBottom() : goToTop()}
        class="grid size-12 place-items-center rounded-full border border-line bg-paper text-accent shadow-md outline-none hover:bg-accent-soft active:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d={canScrollDown() ? "M5 20h14M12 4v12m-5-5 5 5 5-5" : "M5 4h14M12 20V8m-5 5 5-5 5 5"} />
        </svg>
      </button>
    </nav>
  );
}
