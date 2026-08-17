use std::sync::Arc;

use leptos::prelude::*;

use super::{
    components::{
        category_filter::CategoryFilter, cell_detail_sheet::CellDetailSheet, menu_table::MenuTable,
        study_header::StudyHeader,
    },
    model::MenuCatalog,
    state::StudyState,
};

#[component]
pub fn StudyPage(catalog: MenuCatalog) -> impl IntoView {
    let catalog = Arc::new(catalog);
    let state = StudyState::new();
    provide_context(state);

    view! {
        <main
            class="app-scroll mx-auto h-dvh w-full max-w-[480px] overflow-y-scroll bg-surface text-ink shadow-[0_0_0_1px_rgba(32,32,30,0.04)]"
            data-detail-open=move || state.cell_detail().is_some().to_string()
        >
            <StudyHeader catalog=catalog.clone() />
            <CategoryFilter catalog=catalog.clone() />
            <MenuTable catalog />
            <CellDetailSheet />
        </main>
    }
}
