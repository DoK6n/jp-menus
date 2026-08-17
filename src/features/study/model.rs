use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
pub struct MenuCatalog {
    pub schema_version: u8,
    pub venue_type: String,
    pub categories: Vec<MenuCategory>,
}

impl MenuCatalog {
    pub fn total_items(&self) -> usize {
        self.categories
            .iter()
            .map(|category| category.items.len())
            .sum()
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
pub struct MenuCategory {
    pub id: String,
    pub label_ja: String,
    pub label_ko: String,
    pub items: Vec<MenuItem>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
pub struct MenuItem {
    pub id: String,
    pub term: String,
    pub reading: String,
    pub meaning_ko: String,
    #[serde(default)]
    pub aliases: Vec<String>,
    #[serde(default)]
    pub note_ko: Option<String>,
    pub commonness: Commonness,
}

impl MenuItem {
    pub fn matches_query(&self, query: &str) -> bool {
        if query.is_empty() {
            return true;
        }

        let query = query.to_lowercase();
        self.term.to_lowercase().contains(&query)
            || self.reading.to_lowercase().contains(&query)
            || self.meaning_ko.to_lowercase().contains(&query)
            || self
                .aliases
                .iter()
                .any(|alias| alias.to_lowercase().contains(&query))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Commonness {
    Core,
    Common,
    Specialty,
}

#[derive(Debug, Clone)]
pub struct DisplayGroup {
    pub id: String,
    pub label_ja: String,
    pub label_ko: String,
    pub items: Vec<MenuItem>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CellDetail {
    pub label: String,
    pub value: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum StudyColumn {
    Term,
    Reading,
    Meaning,
}
