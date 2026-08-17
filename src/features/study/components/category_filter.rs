use std::sync::Arc;

use leptos::prelude::*;

use crate::features::study::{model::MenuCatalog, state::StudyState};

#[component]
pub fn CategoryFilter(catalog: Arc<MenuCatalog>) -> impl IntoView {
    let state = expect_context::<StudyState>();
    let categories = catalog.categories.clone();

    view! {
        <nav class="border-y border-line bg-paper/70 py-2" aria-label="메뉴 카테고리">
            <div class="scrollbar-none flex gap-1.5 overflow-x-auto px-4 sm:px-5">
                <button
                    type="button"
                    on:click=move |_| state.set_category(None)
                    aria-pressed=move || state.selected_category().is_none().to_string()
                    class="min-h-9 shrink-0 rounded-full border border-line bg-surface px-3.5 text-xs font-bold text-muted outline-none transition-colors aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                    "전체"
                </button>
                <For
                    each=move || categories.clone()
                    key=|category| category.id.clone()
                    children=move |category| {
                        let id_for_click = category.id.clone();
                        let id_for_state = category.id.clone();
                        view! {
                            <button
                                type="button"
                                on:click=move |_| state.set_category(Some(id_for_click.clone()))
                                aria-pressed=move || (state.selected_category().as_deref() == Some(id_for_state.as_str())).to_string()
                                class="min-h-9 shrink-0 rounded-full border border-line bg-surface px-3.5 text-xs font-bold whitespace-nowrap text-muted outline-none transition-colors aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                            >
                                {category.label_ko}
                            </button>
                        }
                    }
                />
            </div>
        </nav>
    }
}
