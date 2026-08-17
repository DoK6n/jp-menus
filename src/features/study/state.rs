use std::collections::HashSet;

use leptos::prelude::*;

use super::{
    model::{CellDetail, DisplayGroup, MenuCatalog, StudyColumn},
    storage,
};

#[derive(Clone, Copy)]
pub struct StudyState {
    hidden_columns: RwSignal<HashSet<StudyColumn>>,
    mastered_ids: RwSignal<HashSet<String>>,
    selected_category: RwSignal<Option<String>>,
    query: RwSignal<String>,
    hide_mastered: RwSignal<bool>,
    cell_detail: RwSignal<Option<CellDetail>>,
}

impl StudyState {
    pub fn new() -> Self {
        Self {
            hidden_columns: RwSignal::new(HashSet::new()),
            mastered_ids: RwSignal::new(storage::load_mastered_ids()),
            selected_category: RwSignal::new(None),
            query: RwSignal::new(String::new()),
            hide_mastered: RwSignal::new(false),
            cell_detail: RwSignal::new(None),
        }
    }

    pub fn toggle_column(self, column: StudyColumn) {
        self.hidden_columns.update(|hidden| {
            if !hidden.insert(column) {
                hidden.remove(&column);
            }
        });
    }

    pub fn is_column_hidden(self, column: StudyColumn) -> bool {
        self.hidden_columns.read().contains(&column)
    }

    pub fn toggle_mastered(self, id: &str) {
        self.mastered_ids.update(|mastered| {
            if !mastered.insert(id.to_owned()) {
                mastered.remove(id);
            }
        });
        storage::save_mastered_ids(&self.mastered_ids.get_untracked());
    }

    pub fn is_mastered(self, id: &str) -> bool {
        self.mastered_ids.read().contains(id)
    }

    pub fn mastered_count(self, catalog: &MenuCatalog) -> usize {
        let mastered = self.mastered_ids.read();
        catalog
            .categories
            .iter()
            .flat_map(|category| &category.items)
            .filter(|item| mastered.contains(&item.id))
            .count()
    }

    pub fn set_category(self, category: Option<String>) {
        self.selected_category.set(category);
    }

    pub fn selected_category(self) -> Option<String> {
        self.selected_category.get()
    }

    pub fn set_query(self, query: String) {
        self.query.set(query);
    }

    pub fn query(self) -> String {
        self.query.get()
    }

    pub fn toggle_hide_mastered(self) {
        self.hide_mastered.update(|hidden| *hidden = !*hidden);
    }

    pub fn hide_mastered(self) -> bool {
        self.hide_mastered.get()
    }

    pub fn open_cell_detail(self, label: &str, value: String) {
        self.cell_detail.set(Some(CellDetail {
            label: label.to_owned(),
            value,
        }));
    }

    pub fn close_cell_detail(self) {
        self.cell_detail.set(None);
    }

    pub fn cell_detail(self) -> Option<CellDetail> {
        self.cell_detail.get()
    }

    pub fn reset_progress(self) {
        self.mastered_ids.set(HashSet::new());
        storage::clear_progress();
    }

    pub fn filtered_groups(self, catalog: &MenuCatalog) -> Vec<DisplayGroup> {
        let category_filter = self.selected_category.get();
        let query = self.query.get().trim().to_owned();
        let hide_mastered = self.hide_mastered.get();
        let mastered = self.mastered_ids.read();

        catalog
            .categories
            .iter()
            .filter(|category| {
                category_filter
                    .as_ref()
                    .is_none_or(|selected| selected == &category.id)
            })
            .filter_map(|category| {
                let items = category
                    .items
                    .iter()
                    .filter(|item| item.matches_query(&query))
                    .filter(|item| !hide_mastered || !mastered.contains(&item.id))
                    .cloned()
                    .collect::<Vec<_>>();

                (!items.is_empty()).then(|| DisplayGroup {
                    id: category.id.clone(),
                    label_ja: category.label_ja.clone(),
                    label_ko: category.label_ko.clone(),
                    items,
                })
            })
            .collect()
    }
}

impl Default for StudyState {
    fn default() -> Self {
        Self::new()
    }
}
