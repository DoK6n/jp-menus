import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectUrl = new URL("../", import.meta.url);
const sushi = JSON.parse(await readFile(new URL("data/sushi.json", projectUrl), "utf8"));
const additional = JSON.parse(
  await readFile(new URL("data/additional_catalogs.json", projectUrl), "utf8"),
);
const library = [
  { ...sushi, label_ja: "寿司", label_ko: "스시" },
  ...additional,
];

const isKebabCase = (value) =>
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const containsCjkIdeograph = (value) => /[\u3400-\u4dbf\u4e00-\u9fff]/u.test(value);
const allowedCommonness = new Set(["core", "common", "specialty"]);

function validateCatalog(catalog, requireJapaneseCategoryLabel) {
  assert.equal(catalog.schema_version, 1);
  const categoryIds = new Set();
  const itemIds = new Set();
  const vocabulary = new Set();

  for (const category of catalog.categories) {
    assert.ok(isKebabCase(category.id), `invalid category ID: ${category.id}`);
    assert.ok(!categoryIds.has(category.id), `duplicate category ID: ${category.id}`);
    categoryIds.add(category.id);
    if (requireJapaneseCategoryLabel) assert.ok(category.label_ja.trim());
    assert.ok(category.label_ko.trim());
    assert.ok(category.items.length > 0);

    for (const item of category.items) {
      assert.ok(isKebabCase(item.id), `invalid item ID: ${item.id}`);
      assert.ok(!itemIds.has(item.id), `duplicate item ID: ${item.id}`);
      itemIds.add(item.id);
      assert.ok(item.term.trim(), `empty term: ${item.id}`);
      assert.ok(item.reading.trim(), `empty reading: ${item.id}`);
      assert.ok(item.meaning_ko.trim(), `empty meaning: ${item.id}`);
      assert.ok(!containsCjkIdeograph(item.reading), `kanji left in reading: ${item.id}`);
      assert.ok(allowedCommonness.has(item.commonness), `invalid commonness: ${item.id}`);

      const vocabularyKey = `${item.term}\u0000${item.reading}\u0000${item.meaning_ko}`;
      assert.ok(!vocabulary.has(vocabularyKey), `duplicate vocabulary row: ${item.id}`);
      vocabulary.add(vocabularyKey);
    }
  }
}

test("sushi catalog meets the contract", () => {
  assert.equal(sushi.schema_version, 1);
  assert.equal(sushi.venue_type, "sushi");
  assert.ok(sushi.categories.length >= 15);
  assert.ok(sushi.categories.flatMap((category) => category.items).length >= 250);
  validateCatalog(sushi, true);
});

test("menu library contains every imported vocabulary group", () => {
  assert.equal(library.length, 12);
  assert.equal(
    library.flatMap((catalog) => catalog.categories).flatMap((category) => category.items).length,
    1_576,
  );

  const catalogIds = new Set();
  const itemIds = new Set();
  for (const catalog of library) {
    assert.ok(!catalogIds.has(catalog.venue_type), `duplicate catalog ID: ${catalog.venue_type}`);
    catalogIds.add(catalog.venue_type);
    assert.ok(catalog.label_ja.trim());
    assert.ok(catalog.label_ko.trim());
    validateCatalog(catalog, false);

    for (const item of catalog.categories.flatMap((category) => category.items)) {
      assert.ok(!itemIds.has(item.id), `duplicate global item ID: ${item.id}`);
      itemIds.add(item.id);
    }
  }
});
