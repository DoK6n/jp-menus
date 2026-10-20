import { For, Show } from "solid-js";

import { kanjiComponentsFor, type KanjiComponentNode } from "../../../data/kanji-components";
import type { MenuItem, StudyColumn } from "../model";
import { CopyValue } from "./copy-value";

interface KanjiDetailProps {
  item: MenuItem;
  selectedColumn: StudyColumn;
}

export function KanjiDetail(props: KanjiDetailProps) {
  const entry = () => kanjiComponentsFor(props.item.term);

  return (
    <div class="min-w-0 space-y-6">
      <div class="min-w-0 space-y-2">
        <div class="rounded-2xl bg-paper px-3 py-2">
          <Show when={entry()}>
            {(data) => <p class="text-right text-xs font-semibold text-muted">{data().stroke_count}획</p>}
          </Show>
          <CopyValue
            value={props.item.term}
            label="한자"
            large
            autofocus={props.selectedColumn === "term"}
            revealOnAutofocus
          />
        </div>
        <CopyValue
          value={props.item.meaning_ko}
          label="한국어 뜻"
          autofocus={props.selectedColumn === "meaning"}
          revealOnAutofocus
        />
        <CopyValue
          value={props.item.reading}
          label="음독·훈독"
          compact
          autofocus={props.selectedColumn === "reading"}
          revealOnAutofocus
        />
      </div>

      <section aria-label="모양으로 나누기" class="min-w-0 border-t border-line pt-5">
        <h2 class="text-base font-extrabold text-ink">모양으로 나누기</h2>
        <p class="mt-2 text-xs leading-5 text-muted">
          글자 모양을 구성 요소로 나누어 살펴봐요. 뜻의 유래나 어원과는 구분해서 보세요.
        </p>
        <Show
          when={entry()}
          fallback={<p class="mt-4 text-sm leading-6 text-muted">구성 요소 자료를 확인할 수 없어요.</p>}
        >
          {(data) => (
            <Show
              when={data().components.length > 0}
              fallback={
                <p class="mt-4 rounded-xl bg-paper px-3 py-4 text-sm leading-6 text-muted">
                  이 자료에서는 더 작은 구성 요소로 나누지 않아요.
                </p>
              }
            >
              <ul class="mt-4 min-w-0 space-y-2">
                <For each={data().components}>
                  {(node) => <li class="min-w-0"><ComponentCard node={node} depth={0} /></li>}
                </For>
              </ul>
              <Show when={data().ungrouped_strokes > 0}>
                <p class="mt-3 text-xs leading-5 text-muted">
                  구성 요소로 묶이지 않은 획 {data().ungrouped_strokes}개가 있어요.
                </p>
              </Show>
            </Show>
          )}
        </Show>
      </section>

      <p class="border-t border-line pt-3 text-xs leading-5 text-muted">
        <span class="block">구성 요소와 획수: KanjiVG</span>
        <a
          class="mt-1 inline-flex min-h-11 items-center rounded font-semibold text-accent underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-accent"
          href={`${import.meta.env.BASE_URL}joyo-sources.html`}
          target="_blank"
          rel="noreferrer"
        >
          자료 출처·이용 조건
        </a>
      </p>
    </div>
  );
}

function ComponentCard(props: { node: KanjiComponentNode; depth: number }) {
  const children = () => props.node.children ?? [];

  return (
    <Show
      when={children().length > 0}
      fallback={
        <div
          class="min-w-0 py-2"
          classList={{ "rounded-xl border border-line bg-paper px-3": props.depth < 2 }}
        >
          <ComponentDescription node={props.node} />
          <PartialNote node={props.node} />
        </div>
      }
    >
      <details
        class="min-w-0"
        classList={{ "rounded-xl border border-line bg-paper": props.depth < 2 }}
      >
        <summary
          class="min-h-11 cursor-pointer rounded-xl py-2 text-accent outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
          classList={{ "px-3": props.depth < 2 }}
        >
          <span class="inline-block w-[calc(100%-2rem)] min-w-0 align-top text-ink">
            <ComponentDescription node={props.node} />
          </span>
        </summary>
        <div class="min-w-0 pb-3" classList={{ "px-3": props.depth < 2 }}>
          <PartialNote node={props.node} />
          <ul
            class="min-w-0 space-y-2"
            classList={{ "border-l border-line pl-2": props.depth < 2 }}
          >
            <For each={children()}>
              {(node) => <li class="min-w-0"><ComponentCard node={node} depth={props.depth + 1} /></li>}
            </For>
          </ul>
          <Show when={props.node.ungrouped_strokes > 0}>
            <p class="mt-2 text-xs leading-5 text-muted">
              세부 구성으로 묶이지 않은 획 {props.node.ungrouped_strokes}개
            </p>
          </Show>
        </div>
      </details>
    </Show>
  );
}

function ComponentDescription(props: { node: KanjiComponentNode }) {
  return (
    <span class="flex min-w-0 items-start gap-3">
      <span class="min-w-9 shrink-0 text-center text-[28px] leading-9 font-bold text-ink" lang="ja">
        {props.node.character}
      </span>
      <span class="min-w-0 flex-1 [overflow-wrap:anywhere]">
        <span class="block text-xs leading-5 text-muted">
          {props.node.position_ko ? `${props.node.position_ko} · ` : ""}{props.node.stroke_count}획
          <Show when={props.node.partial || props.node.part !== undefined}> · 일부 모양</Show>
        </span>
        <Show when={props.node.original}>
          {(original) => <span class="block text-xs leading-5 text-muted">기본형 <span lang="ja">{original()}</span></span>}
        </Show>
        <Show when={props.node.part !== undefined}>
          <span class="block text-xs leading-5 text-muted">자료의 {props.node.part}번 부분</span>
        </Show>
        <span class="block text-sm leading-5 font-semibold text-ink">
          {props.node.meaning_ko || "뜻 정보 없음"}
        </span>
      </span>
    </span>
  );
}

function PartialNote(props: { node: KanjiComponentNode }) {
  return (
    <Show when={props.node.partial || props.node.part !== undefined}>
      <p class="mt-1 mb-2 text-xs leading-5 text-muted">이 구성 요소의 일부 모양이에요.</p>
    </Show>
  );
}
