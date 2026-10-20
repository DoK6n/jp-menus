import { Show } from "solid-js";

import type { MenuItem, StudyColumn } from "../model";
import { studyColumnLabels } from "../model";
import { useStudyState } from "../state";
import { MasteryButton } from "./mastery-button";

type CellKind = StudyColumn;

function estimatedDisplayWidth(value: string): number {
  return [...value].reduce(
    (total, character) =>
      total + (/\s|[\x00-\x7F]/u.test(character) ? 1 : 2),
    0,
  );
}

function fitLevel(kind: CellKind, displayWidth: number): "normal" | "compact" | "tight" {
  const [normalMax, compactMax] =
    kind === "term" ? [6, 10] : kind === "reading" ? [10, 16] : [12, 18];

  if (displayWidth <= normalMax) return "normal";
  if (displayWidth <= compactMax) return "compact";
  return "tight";
}

interface StudyCellProps {
  value: string;
  kind: CellKind;
  item: MenuItem;
  readings?: { on: string[]; kun: string[] };
}

function StudyCell(props: StudyCellProps) {
  const state = useStudyState();
  const hidden = () => state.isColumnHidden(props.kind);
  const displayWidth = () => estimatedDisplayWidth(props.value);
  const label = () => studyColumnLabels[state.selectedScreen()][props.kind];

  return (
    <button
      type="button"
      class="block min-h-11 w-full min-w-0 overflow-hidden rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-default"
      disabled={hidden()}
      aria-label={hidden() ? `${label()} 가려짐` : `${label()} 전체 내용 보기: ${props.value}`}
      title={hidden() ? undefined : props.value}
      onClick={() => state.openCellDetail(label(), props.value, state.selectedScreen() === "kanji"
        ? { item: props.item, column: props.kind }
        : undefined)}
    >
      <span
        class="cell-content study-cell-text"
        classList={{
          "h-10": Boolean(props.readings),
          "text-2xl": state.selectedScreen() === "kanji" && props.kind === "term",
        }}
        data-column={props.kind}
        data-fit={fitLevel(props.kind, displayWidth())}
        data-display-width={displayWidth()}
        data-concealed={String(hidden())}
        aria-hidden={hidden()}
      >
        <Show when={!hidden()}>
          <Show when={props.readings} fallback={props.value}>
            {(readings) => <>
              <span class="block truncate text-[13px] leading-5">음: {readings().on.join("・") || "—"}</span>
              <span class="block truncate text-[13px] leading-5">훈: {readings().kun.join("・") || "—"}</span>
            </>}
          </Show>
        </Show>
      </span>
    </button>
  );
}

interface MenuRowProps {
  item: MenuItem;
}

export function MenuRow(props: MenuRowProps) {
  const state = useStudyState();

  return (
    <tr
      data-menu-item-row
      class="border-b border-line/80 bg-surface transition-opacity last:border-b-0"
      classList={{ "opacity-35": state.isMastered(props.item.id) }}
    >
      <td class="h-16 py-2 pr-2 pl-0 align-middle sm:pr-2.5">
        <StudyCell value={props.item.term} kind="term" item={props.item} />
      </td>
      <td class="h-16 px-1 py-2 align-middle sm:px-1.5">
        <StudyCell
          value={props.item.reading}
          kind="reading"
          item={props.item}
          readings={state.selectedScreen() === "kanji" ? {
            on: props.item.reading_on ?? [],
            kun: props.item.reading_kun ?? [],
          } : undefined}
        />
      </td>
      <td class="h-16 px-1.5 py-2 align-middle sm:px-2">
        <StudyCell value={props.item.meaning_ko} kind="meaning" item={props.item} />
      </td>
      <td class="h-16 w-11 p-0 align-middle">
        <MasteryButton itemId={props.item.id} term={props.item.term} />
      </td>
    </tr>
  );
}
