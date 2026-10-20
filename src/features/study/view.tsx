import { For, Show } from "solid-js";

import { catalogById, kanjiLibrary } from "../../data/catalogs";
import type { MenuCatalog } from "./model";
import { createPullToRefresh } from "./pull-to-refresh";
import { createStudyState, StudyContext, useStudyState } from "./state";
import { CategoryFilter } from "./components/category-filter";
import { CellDetailSheet } from "./components/cell-detail-sheet";
import { MenuTable } from "./components/menu-table";
import { PullToRefreshIndicator } from "./components/pull-to-refresh-indicator";
import { ScrollNavigation } from "./components/scroll-navigation";
import { StudyHeader } from "./components/study-header";

interface StudyPageProps {
  library: MenuCatalog[];
}

export function StudyPage(props: StudyPageProps) {
  const state = createStudyState();
  let scrollContainer: HTMLElement | undefined;
  let scrollContent: HTMLDivElement | undefined;
  const pullToRefresh = createPullToRefresh(() => scrollContainer);

  const handleScroll = (event: Event & { currentTarget: HTMLElement }) => {
    const canvas = event.currentTarget;
    const remaining = canvas.scrollHeight - canvas.scrollTop - canvas.clientHeight;
    const catalog = catalogById(state.selectedCatalog());
    if (remaining <= 320 && catalog && state.hasMoreItems(catalog)) {
      state.loadMoreItems();
    }
  };

  return (
    <StudyContext.Provider value={state}>
      <div class="relative mx-auto flex h-dvh w-full max-w-[480px] flex-col bg-surface text-ink shadow-[0_0_0_1px_rgba(32,32,30,0.04)]">
        <main
          id="study-scroll"
          ref={scrollContainer}
          class="app-scroll min-h-0 w-full flex-1 overflow-y-scroll overscroll-y-contain"
          data-detail-open={String(Boolean(state.cellDetail()))}
          data-pull-state={pullToRefresh.phase()}
          onScroll={handleScroll}
        >
          <div ref={scrollContent} class="pb-[calc(3rem+max(1rem,env(safe-area-inset-bottom)))]">
            <PullToRefreshIndicator
              distance={pullToRefresh.pullDistance()}
              phase={pullToRefresh.phase()}
              threshold={pullToRefresh.threshold}
            />
            <StudyScreenNavigation />
            <StudyHeader library={state.selectedScreen() === "kanji" ? kanjiLibrary : props.library} />
            <Show when={state.selectedScreen() === "menus"}>
              <MenuTabs library={props.library} />
            </Show>
            <CategoryFilter />
            <MenuTable />
          </div>
        </main>
        <ScrollNavigation scrollElement={() => scrollContainer} contentElement={() => scrollContent} />
        <CellDetailSheet />
      </div>
    </StudyContext.Provider>
  );
}

function StudyScreenNavigation() {
  const state = useStudyState();

  return (
    <nav aria-label="학습 화면" class="px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-5">
      <div class="grid grid-cols-2 gap-1 rounded-xl bg-paper p-1">
        <For each={[
          { id: "menus", label: "메뉴 단어" },
          { id: "kanji", label: "상용한자" },
        ] as const}>
          {(screen) => (
            <button
              type="button"
              onClick={() => state.selectScreen(screen.id)}
              aria-pressed={state.selectedScreen() === screen.id}
              class="min-h-11 rounded-lg text-sm font-bold text-muted outline-none aria-pressed:bg-surface aria-pressed:text-accent aria-pressed:shadow-sm focus-visible:ring-2 focus-visible:ring-accent"
            >
              {screen.label}
            </button>
          )}
        </For>
      </div>
    </nav>
  );
}

function MenuTabs(props: StudyPageProps) {
  const state = useStudyState();

  return (
    <nav class="border-t border-line bg-surface py-2" aria-label="메뉴 종류">
      <div class="scrollbar-none flex gap-2 overflow-x-auto px-4 sm:px-5">
        <For each={props.library}>
          {(catalog) => (
            <button
              type="button"
              onClick={() => state.selectCatalog(catalog.venue_type)}
              aria-pressed={state.selectedCatalog() === catalog.venue_type}
              class="min-h-11 shrink-0 rounded-lg border border-line bg-paper px-3.5 text-sm font-extrabold whitespace-nowrap text-muted outline-none transition-colors aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {catalog.label_ko}
            </button>
          )}
        </For>
      </div>
    </nav>
  );
}
