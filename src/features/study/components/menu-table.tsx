import { createMemo, For, Show } from "solid-js";

import { catalogById } from "../../../data/catalogs";
import type { StudyColumn } from "../model";
import { studyColumnLabels } from "../model";
import { useStudyState } from "../state";
import { MenuRow } from "./menu-row";

export function MenuTable() {
  const state = useStudyState();
  const isKanji = () => state.selectedScreen() === "kanji";
  const labels = () => studyColumnLabels[state.selectedScreen()];
  const catalog = () => catalogById(state.selectedCatalog());
  const filteredGroups = createMemo(() => {
    const current = catalog();
    return current ? state.filteredGroups(current) : [];
  });
  const filteredCount = () => filteredGroups().reduce((total, group) => total + group.items.length, 0);
  const groups = () => {
    const current = catalog();
    return current ? state.visibleFilteredGroups(current) : [];
  };
  const hasMore = () => {
    const current = catalog();
    return Boolean(current && state.hasMoreItems(current));
  };
  const isEmpty = () => {
    const current = catalog();
    return !current || state.filteredGroups(current).length === 0;
  };

  return (
    <section aria-label={isKanji() ? "일본 상용한자" : "일본 메뉴 단어"} class="pb-[env(safe-area-inset-bottom)]">
      <Show when={isKanji()}>
        <details class="border-b border-line px-4 text-xs leading-5 text-muted sm:px-5">
          <summary class="flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <span class="font-semibold">한자 자료 안내 <span aria-hidden="true">＋</span></span>
            <span>{filteredCount().toLocaleString("ko-KR")}자</span>
          </summary>
          <p class="pb-2">2010년 상용한자 2,136자를 학년별로 나눴어요. 읽기는 KANJIDIC2의 사전 음독·훈독이며, 공식 상용한자표 밖의 읽기도 포함될 수 있어요.</p>
          <p class="pb-2">한국어는 한자 훈음 중심이며, 일본어 단어에서의 뜻과 다를 수 있어요. 긴 읽기나 뜻은 셀을 눌러 확인하세요.</p>
          <a class="mb-2 inline-flex min-h-11 items-center rounded font-semibold text-accent underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-accent" href={`${import.meta.env.BASE_URL}joyo-sources.html`} target="_blank" rel="noreferrer">데이터 출처·이용 조건</a>
        </details>
      </Show>
      <p class="border-b border-line bg-surface px-4 py-2.5 text-xs leading-5 text-muted sm:px-5">
        열 제목을 누르면 답을 가릴 수 있어요.
      </p>
      <table class="mx-4 w-[calc(100%-2rem)] table-fixed border-collapse sm:mx-5 sm:w-[calc(100%-2.5rem)]">
        <caption class="sr-only">
          {isKanji() ? "일본 상용한자의 한자, 음독·훈독, 한국어 뜻 학습표" : "일본 메뉴의 일본어 표기, 후리가나, 한국어 뜻 학습표"}
        </caption>
        <colgroup>
          <col class={isKanji() ? "w-[21%]" : "w-[31%]"} />
          <col class={isKanji() ? "w-[39%]" : "w-[27%]"} />
          <col />
          <col class="w-11" />
        </colgroup>
        <thead>
          <tr class="text-left">
            <StudyColumnHeader label={labels().term} column="term" />
            <StudyColumnHeader label={labels().reading} column="reading" />
            <StudyColumnHeader label={labels().meaning} column="meaning" />
            <th
              scope="col"
              class="sticky top-0 z-20 h-12 w-11 border-b border-line bg-paper"
            >
              <span class="sr-only">암기 상태</span>
            </th>
          </tr>
        </thead>
        <For each={groups()}>
          {(group) => (
            <tbody>
              <tr>
                <th
                  colSpan={4}
                  scope="rowgroup"
                  class="border-y border-line bg-paper px-0 py-2 text-left"
                >
                  <span class="text-[11px] font-bold tracking-[0.08em] text-accent">
                    {group.label_ja}
                  </span>
                  <span class="ml-2 text-xs font-bold text-muted">{group.label_ko}</span>
                  <span class="ml-1.5 text-[10px] font-semibold text-muted/60">
                    {filteredGroups().find((category) => category.id === group.id)?.items.length ?? 0}
                  </span>
                </th>
              </tr>
              <For each={group.items}>{(item) => <MenuRow item={item} />}</For>
            </tbody>
          )}
        </For>
      </table>

      <Show when={hasMore()}>
        <p class="px-4 py-5 text-center text-xs font-semibold text-muted" role="status">
          아래로 스크롤하면 단어를 더 불러와요
        </p>
      </Show>

      <Show when={isEmpty()}>
        <div class="px-6 py-16 text-center">
          <p class="text-base font-bold">보여줄 단어가 없어요</p>
          <p class="mt-2 text-sm text-muted">검색어나 필터를 바꿔보세요.</p>
        </div>
      </Show>
    </section>
  );
}

interface StudyColumnHeaderProps {
  label: string;
  column: StudyColumn;
}

function StudyColumnHeader(props: StudyColumnHeaderProps) {
  const state = useStudyState();
  const hidden = () => state.isColumnHidden(props.column);

  return (
    <th scope="col" class="sticky top-0 z-20 h-12 border-b border-line bg-paper p-0">
      <button
        type="button"
        onClick={() => state.toggleColumn(props.column)}
        aria-pressed={hidden()}
        aria-label={`${props.label} 열 ${hidden() ? "보이기" : "가리기"}`}
        class="group flex h-12 w-full items-center gap-1 pr-2 text-left text-[11px] leading-tight font-extrabold text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset sm:pr-3 sm:text-xs"
        classList={{ "pl-0": props.column === "term", "pl-2 sm:pl-3": props.column !== "term" }}
      >
        <span>{props.label}</span>
        <svg
          class="size-3.5 shrink-0 text-muted/60 group-aria-pressed:text-accent"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          aria-hidden="true"
        >
          <path d="M2.5 10s2.6-4.5 7.5-4.5 7.5 4.5 7.5 4.5-2.6 4.5-7.5 4.5S2.5 10 2.5 10Z" />
          <circle cx="10" cy="10" r="2.2" />
          <path
            class="opacity-0 group-aria-pressed:opacity-100"
            d="m3 3 14 14"
          />
        </svg>
      </button>
    </th>
  );
}
