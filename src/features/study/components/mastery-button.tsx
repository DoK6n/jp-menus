import { useStudyState } from "../state";

interface MasteryButtonProps {
  itemId: string;
  term: string;
}

export function MasteryButton(props: MasteryButtonProps) {
  const state = useStudyState();
  const mastered = () => state.isMastered(props.itemId);

  return (
    <button
      type="button"
      onClick={() => state.toggleMastered(props.itemId)}
      aria-pressed={mastered()}
      aria-label={mastered() ? `${props.term} 다시 학습` : `${props.term} 외운 단어로 표시`}
      class="group flex size-11 items-center justify-center rounded-lg text-muted outline-none hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
    >
      <span
        class="flex size-5 items-center justify-center rounded-full border-2 border-line bg-surface transition-colors group-aria-pressed:border-accent group-aria-pressed:bg-accent group-aria-pressed:text-white"
        aria-hidden="true"
      >
        <svg
          class="size-3 opacity-0 group-aria-pressed:opacity-100"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
        >
          <path d="m3 8 3 3 7-7" />
        </svg>
      </span>
    </button>
  );
}
