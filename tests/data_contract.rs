use std::collections::HashSet;

use jp_menus::data::sushi::load_catalog;

fn is_kebab_case(value: &str) -> bool {
    !value.is_empty()
        && !value.starts_with('-')
        && !value.ends_with('-')
        && !value.contains("--")
        && value.chars().all(|character| {
            character.is_ascii_lowercase() || character.is_ascii_digit() || character == '-'
        })
}

fn contains_cjk_ideograph(value: &str) -> bool {
    value
        .chars()
        .any(|character| matches!(character as u32, 0x3400..=0x4dbf | 0x4e00..=0x9fff))
}

#[test]
fn sushi_catalog_meets_the_contract() {
    let catalog = load_catalog().expect("embedded sushi catalog should parse");

    assert_eq!(catalog.schema_version, 1);
    assert_eq!(catalog.venue_type, "sushi");
    assert!(catalog.categories.len() >= 15);
    assert!(catalog.total_items() >= 250);

    let mut category_ids = HashSet::new();
    let mut item_ids = HashSet::new();
    let mut vocabulary = HashSet::new();

    for category in &catalog.categories {
        assert!(
            is_kebab_case(&category.id),
            "invalid category ID: {}",
            category.id
        );
        assert!(
            category_ids.insert(&category.id),
            "duplicate category ID: {}",
            category.id
        );
        assert!(!category.label_ja.trim().is_empty());
        assert!(!category.label_ko.trim().is_empty());
        assert!(!category.items.is_empty());

        for item in &category.items {
            assert!(is_kebab_case(&item.id), "invalid item ID: {}", item.id);
            assert!(item_ids.insert(&item.id), "duplicate item ID: {}", item.id);
            assert!(!item.term.trim().is_empty(), "empty term: {}", item.id);
            assert!(
                !item.reading.trim().is_empty(),
                "empty reading: {}",
                item.id
            );
            assert!(
                !item.meaning_ko.trim().is_empty(),
                "empty meaning: {}",
                item.id
            );
            assert!(
                !contains_cjk_ideograph(&item.reading),
                "kanji left in reading: {}",
                item.id
            );
            assert!(
                vocabulary.insert((&item.term, &item.reading, &item.meaning_ko)),
                "duplicate vocabulary row: {}",
                item.id
            );
        }
    }
}
