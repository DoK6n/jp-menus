use std::sync::Arc;

use leptos::prelude::*;

use crate::features::study::{
    components::menu_row::MenuRow,
    model::{MenuLibrary, StudyColumn},
    state::StudyState,
};

#[component]
pub fn MenuTable(library: Arc<MenuLibrary>) -> impl IntoView {
    let state = expect_context::<StudyState>();
    let filtered_library = library.clone();
    let pagination_library = library.clone();

    view! {
        <section aria-label="일본 메뉴 단어" class="pb-[env(safe-area-inset-bottom)]">
            <p class="border-b border-line bg-surface px-4 py-2.5 text-xs leading-5 text-muted sm:px-5">
                "열 제목을 누르면 답을 가릴 수 있어요."
            </p>
            <table class="w-full table-fixed border-collapse">
                <caption class="sr-only">
                    "일본 메뉴의 일본어 표기, 후리가나, 한국어 뜻 학습표"
                </caption>
                <colgroup>
                    <col class="w-[31%]" />
                    <col class="w-[27%]" />
                    <col />
                    <col class="w-11" />
                </colgroup>
                <thead>
                    <tr class="text-left">
                        <StudyColumnHeader label="한자·표기" column=StudyColumn::Term />
                        <StudyColumnHeader label="후리가나" column=StudyColumn::Reading />
                        <StudyColumnHeader label="한국어 뜻" column=StudyColumn::Meaning />
                        <th scope="col" class="sticky top-0 z-20 h-12 w-11 border-b border-line bg-paper">
                            <span class="sr-only">"암기 상태"</span>
                        </th>
                    </tr>
                </thead>
                <For
                    each=move || {
                        filtered_library
                            .catalog(&state.selected_catalog())
                            .map(|catalog| state.visible_filtered_groups(catalog))
                            .unwrap_or_default()
                    }
                    // A category can stay mounted while its filtered items change.
                    // Include the visible item IDs so Leptos rebuilds that tbody.
                    key=|group| {
                        (
                            group.id.clone(),
                            group
                                .items
                                .iter()
                                .map(|item| item.id.clone())
                                .collect::<Vec<_>>(),
                        )
                    }
                    children=move |group| {
                        let items = group.items.clone();
                        view! {
                            <tbody>
                                <tr>
                                    <th colspan="4" scope="rowgroup" class="border-y border-line bg-paper px-3 py-2 text-left sm:px-4">
                                        <span class="text-[11px] font-bold tracking-[0.08em] text-accent">{group.label_ja}</span>
                                        <span class="ml-2 text-xs font-bold text-muted">{group.label_ko}</span>
                                        <span class="ml-1.5 text-[10px] font-semibold text-muted/60">{format!("{}", items.len())}</span>
                                    </th>
                                </tr>
                                <For
                                    each=move || items.clone()
                                    key=|item| item.id.clone()
                                    children=move |item| view! { <MenuRow item /> }
                                />
                            </tbody>
                        }
                    }
                />
            </table>
            <Show when=move || {
                pagination_library
                    .catalog(&state.selected_catalog())
                    .is_some_and(|catalog| state.has_more_items(catalog))
            }>
                <p class="px-4 py-5 text-center text-xs font-semibold text-muted" role="status">
                    "아래로 스크롤하면 단어를 더 불러와요"
                </p>
            </Show>
            <Show when=move || {
                library
                    .catalog(&state.selected_catalog())
                    .is_none_or(|catalog| state.filtered_groups(catalog).is_empty())
            }>
                <div class="px-6 py-16 text-center">
                    <p class="text-base font-bold">"보여줄 단어가 없어요"</p>
                    <p class="mt-2 text-sm text-muted">"검색어나 필터를 바꿔보세요."</p>
                </div>
            </Show>
        </section>
    }
}

#[component]
fn StudyColumnHeader(label: &'static str, column: StudyColumn) -> impl IntoView {
    let state = expect_context::<StudyState>();

    view! {
        <th scope="col" class="sticky top-0 z-20 h-12 border-b border-line bg-paper p-0">
            <button
                type="button"
                on:click=move |_| state.toggle_column(column)
                aria-pressed=move || state.is_column_hidden(column).to_string()
                aria-label=move || if state.is_column_hidden(column) {
                    format!("{label} 열 보이기")
                } else {
                    format!("{label} 열 가리기")
                }
                class="group flex h-12 w-full items-center gap-1 px-2 text-left text-[11px] leading-tight font-extrabold text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset sm:px-3 sm:text-xs"
            >
                <span>{label}</span>
                <svg class="size-3.5 shrink-0 text-muted/60 group-aria-pressed:text-accent" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                    <path d="M2.5 10s2.6-4.5 7.5-4.5 7.5 4.5 7.5 4.5-2.6 4.5-7.5 4.5S2.5 10 2.5 10Z"></path>
                    <circle cx="10" cy="10" r="2.2"></circle>
                    <path class="opacity-0 group-aria-pressed:opacity-100" d="m3 3 14 14"></path>
                </svg>
            </button>
        </th>
    }
}
