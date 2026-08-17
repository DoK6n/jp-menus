use crate::features::study::model::MenuCatalog;

const SUSHI_CATALOG_JSON: &str =
    include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/data/sushi.json"));

pub fn load_catalog() -> Result<MenuCatalog, serde_json::Error> {
    serde_json::from_str(SUSHI_CATALOG_JSON)
}
