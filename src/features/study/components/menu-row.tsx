import type { MenuItem, StudyColumn } from "../model";
import { useStudyState } from "../state";
import { MasteryButton } from "./mastery-button";

type CellKind = StudyColumn;

const cellLabels: Record<CellKind, string> = {
  term: "한자·표기",
  reading: "후리가나",
  meaning: "한국어 뜻",
};

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
}

function StudyCell(props: StudyCellProps) {
  const state = useStudyState();
  const hidden = () => state.isColumnHidden(props.kind);
  const displayWidth = () => estimatedDisplayWidth(props.value);
  const label = () => cellLabels[props.kind];

  return (
    <button
      type="button"
      class="block w-full min-w-0 overflow-hidden rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:cursor-default"
      disabled={hidden()}
      aria-label={`${label()} 전체 내용 보기: ${props.value}`}
      title={props.value}
      onClick={() => state.openCellDetail(label(), props.value)}
    >
      <span
        class="cell-content study-cell-text"
        data-column={props.kind}
        data-fit={fitLevel(props.kind, displayWidth())}
        data-display-width={displayWidth()}
        data-concealed={String(hidden())}
        aria-hidden={hidden()}
      >
        {props.value}
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
      <td class="h-16 px-2 py-2 align-middle sm:px-2.5">
        <StudyCell value={props.item.term} kind="term" />
      </td>
      <td class="h-16 px-1 py-2 align-middle sm:px-1.5">
        <StudyCell value={props.item.reading} kind="reading" />
      </td>
      <td class="h-16 px-1.5 py-2 align-middle sm:px-2">
        <StudyCell value={props.item.meaning_ko} kind="meaning" />
      </td>
      <td class="h-16 w-11 p-0 align-middle">
        <MasteryButton itemId={props.item.id} term={props.item.term} />
      </td>
    </tr>
  );
}
