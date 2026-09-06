import { For } from "solid-js";

import { catalogById } from "../../data/catalogs";
import type { MenuCatalog } from "./model";
import { createStudyState, StudyContext, useStudyState } from "./state";
import { CategoryFilter } from "./components/category-filter";
import { CellDetailSheet } from "./components/cell-detail-sheet";
import { MenuTable } from "./components/menu-table";
import { StudyHeader } from "./components/study-header";

interface StudyPageProps {
  library: MenuCatalog[];
}

export function StudyPage(props: StudyPageProps) {
  const state = createStudyState();

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
      <main
        class="app-scroll mx-auto h-dvh w-full max-w-[480px] overflow-y-scroll bg-surface text-ink shadow-[0_0_0_1px_rgba(32,32,30,0.04)]"
        data-detail-open={String(Boolean(state.cellDetail()))}
        onScroll={handleScroll}
      >
        <StudyHeader library={props.library} />
        <MenuTabs library={props.library} />
        <CategoryFilter />
        <MenuTable />
        <CellDetailSheet />
      </main>
    </StudyContext.Provider>
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
