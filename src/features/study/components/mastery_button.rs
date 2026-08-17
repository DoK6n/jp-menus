use leptos::prelude::*;

use crate::features::study::state::StudyState;

#[component]
pub fn MasteryButton(item_id: String, term: String) -> impl IntoView {
    let state = expect_context::<StudyState>();
    let id_for_pressed = item_id.clone();
    let id_for_label = item_id.clone();
    let id_for_click = item_id;
    let term_for_label = term;

    view! {
        <button
            type="button"
            on:click=move |_| state.toggle_mastered(&id_for_click)
            aria-pressed=move || state.is_mastered(&id_for_pressed).to_string()
            aria-label=move || if state.is_mastered(&id_for_label) {
                format!("{term_for_label} 다시 학습")
            } else {
                format!("{term_for_label} 외운 단어로 표시")
            }
            class="group flex size-11 items-center justify-center rounded-lg text-muted outline-none hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        >
            <span class="flex size-5 items-center justify-center rounded-full border-2 border-line bg-surface transition-colors group-aria-pressed:border-accent group-aria-pressed:bg-accent group-aria-pressed:text-white" aria-hidden="true">
                <svg class="size-3 opacity-0 group-aria-pressed:opacity-100" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="m3 8 3 3 7-7"></path>
                </svg>
            </span>
        </button>
    }
}
