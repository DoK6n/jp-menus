use std::sync::Arc;

use leptos::{ev::Event, prelude::*};

use crate::features::study::{model::MenuCatalog, state::StudyState};

#[component]
pub fn StudyHeader(catalog: Arc<MenuCatalog>) -> impl IntoView {
    let state = expect_context::<StudyState>();
    let total = catalog.total_items();
    let progress_catalog = catalog.clone();

    let on_reset = move |_| {
        #[cfg(target_arch = "wasm32")]
        let confirmed = web_sys::window()
            .and_then(|window| {
                window
                    .confirm_with_message("외운 항목 표시를 모두 초기화할까요?")
                    .ok()
            })
            .unwrap_or(false);

        #[cfg(not(target_arch = "wasm32"))]
        let confirmed = true;

        if confirmed {
            state.reset_progress();
        }
    };

    let on_query = move |event: Event| state.set_query(event_target_value(&event));

    view! {
        <header class="px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 sm:px-5">
            <div class="flex items-end justify-between gap-4">
                <div>
                    <p class="text-[11px] font-bold tracking-[0.2em] text-accent uppercase">"お鮨のことば"</p>
                    <h1 class="mt-1 text-[26px] leading-tight font-extrabold tracking-[-0.035em]">"스시 단어장"</h1>
                </div>
                <div class="shrink-0 text-right">
                    <p class="text-[11px] font-semibold text-muted">"외운 단어"</p>
                    <p class="mt-0.5 font-mono text-sm font-bold tabular-nums">
                        {move || state.mastered_count(&progress_catalog)}
                        <span class="px-1 text-line">"/"</span>
                        {total}
                    </p>
                </div>
            </div>

            <div class="mt-3 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
                <div
                    class="h-full rounded-full bg-accent transition-[width] duration-200"
                    style:width=move || format!("{}%", state.mastered_count(&catalog) * 100 / total.max(1))
                ></div>
            </div>

            <label class="relative mt-5 block">
                <span class="sr-only">"메뉴 검색"</span>
                <svg class="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <circle cx="11" cy="11" r="7"></circle>
                    <path d="m20 20-4-4"></path>
                </svg>
                <input
                    type="search"
                    value=move || state.query()
                    on:input=on_query
                    placeholder="한자·읽음·뜻 검색"
                    class="h-11 w-full rounded-xl border border-line bg-paper pr-10 pl-10 text-[15px] outline-none placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15"
                />
            </label>

            <div class="mt-3 flex min-h-11 items-center justify-between gap-3">
                <button
                    type="button"
                    on:click=move |_| state.toggle_hide_mastered()
                    aria-pressed=move || state.hide_mastered().to_string()
                    class="group flex min-h-11 items-center gap-2 text-sm font-semibold text-muted outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-accent"
                >
                    <span class="relative h-5 w-9 rounded-full bg-line transition-colors group-aria-pressed:bg-accent" aria-hidden="true">
                        <span class="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform group-aria-pressed:translate-x-4"></span>
                    </span>
                    "외운 항목 숨기기"
                </button>
                <button
                    type="button"
                    on:click=on_reset
                    class="min-h-11 shrink-0 px-1 text-xs font-semibold text-muted underline decoration-line underline-offset-4 outline-none hover:text-ink focus-visible:rounded focus-visible:ring-2 focus-visible:ring-accent"
                >
                    "초기화"
                </button>
            </div>
        </header>
    }
}
