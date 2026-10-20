import { createSignal, onCleanup, onMount, Show } from "solid-js";

type CopyState = "idle" | "copied" | "failed";

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through when a browser or installed web app denies Clipboard API access.
  }

  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.inset = "0 auto auto -9999px";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();
  textArea.setSelectionRange(0, value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textArea.remove();
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }
}

interface CopyValueProps {
  value: string;
  label?: string;
  large?: boolean;
  compact?: boolean;
  autofocus?: boolean;
  revealOnAutofocus?: boolean;
}

export function CopyValue(props: CopyValueProps) {
  const [copyState, setCopyState] = createSignal<CopyState>("idle");
  let button: HTMLButtonElement | undefined;
  let resetTimer: number | undefined;
  let disposed = false;

  onMount(() => {
    if (props.autofocus) {
      button?.focus({ preventScroll: true });
      if (props.revealOnAutofocus) button?.scrollIntoView({ block: "nearest" });
    }
  });

  onCleanup(() => {
    disposed = true;
    if (resetTimer !== undefined) window.clearTimeout(resetTimer);
  });

  const handleCopy = async () => {
    const copied = await copyToClipboard(props.value);
    if (disposed) return;
    setCopyState(copied ? "copied" : "failed");
    if (resetTimer !== undefined) window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => setCopyState("idle"), 1600);
  };

  const copyLabel = () => copyState() === "copied" ? "복사됨" : copyState() === "failed" ? "복사 실패" : "복사";

  return (
    <div class="min-w-0">
      <Show when={props.label}>
        <p class="mb-1 px-2 text-xs font-bold text-muted">{props.label}</p>
      </Show>
      <button
        ref={button}
        type="button"
        class="group flex min-h-14 w-full items-start justify-between gap-3 rounded-xl px-2 py-2 text-left outline-none transition-colors hover:bg-paper active:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`${props.value} 복사`}
        onClick={handleCopy}
      >
        <span
          class="min-w-0 tracking-[-0.025em] text-ink [overflow-wrap:anywhere]"
          classList={{
            "text-[72px] leading-none font-bold": Boolean(props.large),
            "text-[24px] leading-[1.45] font-bold": !props.large && !props.compact,
            "text-lg leading-relaxed font-medium": !props.large && Boolean(props.compact),
          }}
        >
          {props.value}
        </span>
        <span class="mt-1 flex min-h-8 shrink-0 items-center gap-1.5 rounded-full bg-paper px-2.5 text-xs font-bold text-muted group-active:text-accent" aria-hidden="true">
          <Show when={copyState() === "copied"} fallback={
            <svg class="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <rect x="6.5" y="6.5" width="9" height="9" rx="1.5" />
              <path d="M13.5 6.5V5A1.5 1.5 0 0 0 12 3.5H5A1.5 1.5 0 0 0 3.5 5v7A1.5 1.5 0 0 0 5 13.5h1.5" />
            </svg>
          }>
            <svg class="size-4 text-accent" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m4 10 4 4 8-8" />
            </svg>
          </Show>
          {copyLabel()}
        </span>
      </button>
      <p class="sr-only" role="status" aria-live="polite">
        {copyState() === "copied" ? `${props.value} 복사됨` : copyState() === "failed" ? "클립보드에 복사하지 못했습니다" : ""}
      </p>
    </div>
  );
}
