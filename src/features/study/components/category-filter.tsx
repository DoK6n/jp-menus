import { For } from "solid-js";

import { catalogById } from "../../../data/catalogs";
import { useStudyState } from "../state";

export function CategoryFilter() {
  const state = useStudyState();
  const categories = () => catalogById(state.selectedCatalog())?.categories ?? [];

  return (
    <nav class="border-y border-line bg-paper/70 py-2" aria-label="메뉴 카테고리">
      <div class="scrollbar-none flex gap-1.5 overflow-x-auto px-4 sm:px-5">
        <button
          type="button"
          onClick={() => state.setCategory()}
          aria-pressed={!state.selectedCategory()}
          class="min-h-9 shrink-0 rounded-full border border-line bg-surface px-3.5 text-xs font-bold text-muted outline-none transition-colors aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          전체
        </button>
        <For each={categories()}>
          {(category) => (
            <button
              type="button"
              onClick={() => state.setCategory(category.id)}
              aria-pressed={state.selectedCategory() === category.id}
              class="min-h-9 shrink-0 rounded-full border border-line bg-surface px-3.5 text-xs font-bold whitespace-nowrap text-muted outline-none transition-colors aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {category.label_ko}
            </button>
          )}
        </For>
      </div>
    </nav>
  );
}
