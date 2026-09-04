use std::sync::Arc;

use leptos::prelude::*;

use super::{
    components::{
        category_filter::CategoryFilter, cell_detail_sheet::CellDetailSheet, menu_table::MenuTable,
        study_header::StudyHeader,
    },
    model::MenuLibrary,
    state::StudyState,
};

#[component]
pub fn StudyPage(library: MenuLibrary) -> impl IntoView {
    let library = Arc::new(library);
    let state = StudyState::new();
    provide_context(state);

    let header_library = library.clone();
    let tabs_library = library.clone();
    let category_library = library.clone();
    let table_library = library.clone();

    view! {
        <main
            class="app-scroll mx-auto h-dvh w-full max-w-[480px] overflow-y-scroll bg-surface text-ink shadow-[0_0_0_1px_rgba(32,32,30,0.04)]"
            data-detail-open=move || state.cell_detail().is_some().to_string()
        >
            <StudyHeader library=header_library />
            <MenuTabs library=tabs_library />
            <CategoryFilter library=category_library />
            <MenuTable library=table_library />
            <CellDetailSheet />
        </main>
    }
}

#[component]
fn MenuTabs(library: Arc<MenuLibrary>) -> impl IntoView {
    let state = expect_context::<StudyState>();
    let catalogs = library.catalogs.clone();

    view! {
        <nav class="border-t border-line bg-surface py-2" aria-label="메뉴 종류">
            <div class="scrollbar-none flex gap-2 overflow-x-auto px-4 sm:px-5">
                <For
                    each=move || catalogs.clone()
                    key=|catalog| catalog.venue_type.clone()
                    children=move |catalog| {
                        let id_for_click = catalog.venue_type.clone();
                        let id_for_state = catalog.venue_type.clone();
                        view! {
                            <button
                                type="button"
                                on:click=move |_| state.select_catalog(id_for_click.clone())
                                aria-pressed=move || (state.selected_catalog() == id_for_state).to_string()
                                class="min-h-11 shrink-0 rounded-lg border border-line bg-paper px-3.5 text-sm font-extrabold whitespace-nowrap text-muted outline-none transition-colors aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                            >
                                {catalog.label_ko}
                            </button>
                        }
                    }
                />
            </div>
        </nav>
    }
}
