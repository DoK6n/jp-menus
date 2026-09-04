use crate::features::study::model::{MenuCatalog, MenuLibrary};

const SUSHI_CATALOG_JSON: &str =
    include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/data/sushi.json"));
const ADDITIONAL_CATALOGS_JSON: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/data/additional_catalogs.json"
));

pub fn load_catalog() -> Result<MenuCatalog, serde_json::Error> {
    serde_json::from_str(SUSHI_CATALOG_JSON)
}

pub fn load_library() -> Result<MenuLibrary, serde_json::Error> {
    let mut sushi = load_catalog()?;
    sushi.label_ja = "寿司".to_owned();
    sushi.label_ko = "스시".to_owned();

    let mut catalogs: Vec<MenuCatalog> = serde_json::from_str(ADDITIONAL_CATALOGS_JSON)?;
    catalogs.insert(0, sushi);
    Ok(MenuLibrary { catalogs })
}
