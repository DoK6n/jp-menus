import { batch, createContext, createSignal, useContext } from "solid-js";

import type {
  CellDetail,
  DisplayGroup,
  MenuCatalog,
  StudyColumn,
} from "./model";
import { clearProgress, loadMasteredIds, saveMasteredIds } from "./storage";

const PAGE_SIZE = 60;

function itemMatchesQuery(
  item: DisplayGroup["items"][number],
  rawQuery: string,
): boolean {
  const query = rawQuery.trim().toLocaleLowerCase();
  if (!query) return true;

  return [item.term, item.reading, item.meaning_ko, ...(item.aliases ?? [])].some(
    (value) => value.toLocaleLowerCase().includes(query),
  );
}

export function createStudyState() {
  const [hiddenColumns, setHiddenColumns] = createSignal<Set<StudyColumn>>(new Set());
  const [masteredIds, setMasteredIds] = createSignal<Set<string>>(loadMasteredIds());
  const [selectedCatalog, setSelectedCatalog] = createSignal("sushi");
  const [selectedCategory, setSelectedCategory] = createSignal<string>();
  const [query, setQueryValue] = createSignal("");
  const [hideMastered, setHideMastered] = createSignal(false);
  const [cellDetail, setCellDetail] = createSignal<CellDetail>();
  const [visibleItemLimit, setVisibleItemLimit] = createSignal(PAGE_SIZE);

  const resetVisibleItems = () => setVisibleItemLimit(PAGE_SIZE);

  const filteredGroups = (catalog: MenuCatalog): DisplayGroup[] => {
    const category = selectedCategory();
    const search = query();
    const hideCompleted = hideMastered();
    const mastered = masteredIds();

    return catalog.categories.flatMap((group) => {
      if (category && group.id !== category) return [];

      const items = group.items.filter(
        (item) =>
          itemMatchesQuery(item, search) &&
          (!hideCompleted || !mastered.has(item.id)),
      );

      return items.length ? [{ ...group, items }] : [];
    });
  };

  return {
    hiddenColumns,
    masteredIds,
    selectedCatalog,
    selectedCategory,
    query,
    hideMastered,
    cellDetail,

    toggleColumn(column: StudyColumn) {
      setHiddenColumns((current) => {
        const next = new Set(current);
        if (next.has(column)) next.delete(column);
        else next.add(column);
        return next;
      });
    },

    isColumnHidden(column: StudyColumn) {
      return hiddenColumns().has(column);
    },

    toggleMastered(id: string) {
      setMasteredIds((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        saveMasteredIds(next);
        return next;
      });
    },

    isMastered(id: string) {
      return masteredIds().has(id);
    },

    totalMasteredCount(library: MenuCatalog[]) {
      const mastered = masteredIds();
      return library.reduce(
        (catalogTotal, catalog) =>
          catalogTotal +
          catalog.categories.reduce(
            (categoryTotal, category) =>
              categoryTotal + category.items.filter((item) => mastered.has(item.id)).length,
            0,
          ),
        0,
      );
    },

    selectCatalog(id: string) {
      batch(() => {
        setSelectedCatalog(id);
        setSelectedCategory(undefined);
        resetVisibleItems();
      });
    },

    setCategory(id?: string) {
      batch(() => {
        setSelectedCategory(id);
        resetVisibleItems();
      });
    },

    setQuery(value: string) {
      batch(() => {
        setQueryValue(value);
        resetVisibleItems();
      });
    },

    toggleHideMastered() {
      batch(() => {
        setHideMastered((current) => !current);
        resetVisibleItems();
      });
    },

    openCellDetail(label: string, value: string) {
      setCellDetail({ label, value });
    },

    closeCellDetail() {
      setCellDetail(undefined);
    },

    resetProgress() {
      setMasteredIds(new Set<string>());
      clearProgress();
    },

    filteredGroups,

    visibleFilteredGroups(catalog: MenuCatalog): DisplayGroup[] {
      let remaining = visibleItemLimit();
      const groups: DisplayGroup[] = [];

      for (const group of filteredGroups(catalog)) {
        if (remaining === 0) break;
        const items = group.items.slice(0, remaining);
        remaining -= items.length;
        if (items.length) groups.push({ ...group, items });
      }

      return groups;
    },

    hasMoreItems(catalog: MenuCatalog) {
      const filteredCount = filteredGroups(catalog).reduce(
        (total, group) => total + group.items.length,
        0,
      );
      return filteredCount > visibleItemLimit();
    },

    loadMoreItems() {
      setVisibleItemLimit((current) => current + PAGE_SIZE);
    },
  };
}

export type StudyState = ReturnType<typeof createStudyState>;

export const StudyContext = createContext<StudyState>();

export function useStudyState(): StudyState {
  const state = useContext(StudyContext);
  if (!state) throw new Error("StudyContext is missing");
  return state;
}
