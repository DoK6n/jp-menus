use std::collections::HashSet;

#[cfg(target_arch = "wasm32")]
use serde::{Deserialize, Serialize};

#[cfg(target_arch = "wasm32")]
const STORAGE_KEY: &str = "jp-menus.study.v1.sushi";

#[cfg(target_arch = "wasm32")]
#[derive(Debug, Default, Serialize, Deserialize)]
struct StoredProgress {
    schema_version: u8,
    mastered_ids: HashSet<String>,
}

#[cfg(target_arch = "wasm32")]
pub fn load_mastered_ids() -> HashSet<String> {
    use gloo_storage::{LocalStorage, Storage};

    LocalStorage::get::<StoredProgress>(STORAGE_KEY)
        .ok()
        .filter(|progress| progress.schema_version == 1)
        .map(|progress| progress.mastered_ids)
        .unwrap_or_default()
}

#[cfg(not(target_arch = "wasm32"))]
pub fn load_mastered_ids() -> HashSet<String> {
    HashSet::new()
}

#[cfg(target_arch = "wasm32")]
pub fn save_mastered_ids(mastered_ids: &HashSet<String>) {
    use gloo_storage::{LocalStorage, Storage};

    let progress = StoredProgress {
        schema_version: 1,
        mastered_ids: mastered_ids.clone(),
    };
    let _ = LocalStorage::set(STORAGE_KEY, progress);
}

#[cfg(not(target_arch = "wasm32"))]
pub fn save_mastered_ids(_mastered_ids: &HashSet<String>) {}

#[cfg(target_arch = "wasm32")]
pub fn clear_progress() {
    use gloo_storage::{LocalStorage, Storage};

    LocalStorage::delete(STORAGE_KEY);
}

#[cfg(not(target_arch = "wasm32"))]
pub fn clear_progress() {}
