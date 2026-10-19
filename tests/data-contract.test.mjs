import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectUrl = new URL("../", import.meta.url);
const sushi = JSON.parse(await readFile(new URL("data/sushi.json", projectUrl), "utf8"));
const additional = JSON.parse(
  await readFile(new URL("data/additional_catalogs.json", projectUrl), "utf8"),
);
const joyoKanji = JSON.parse(
  await readFile(new URL("data/joyo_kanji.json", projectUrl), "utf8"),
);
const joyoRepertoire = (
  await readFile(new URL("data/joyo-repertoire.txt", projectUrl), "utf8")
).trim();
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

test("released menu persistence IDs are unchanged", () => {
  const ids = library
    .flatMap((catalog) => catalog.categories)
    .flatMap((category) => category.items.map((item) => item.id))
    .sort();

  // A released ID change requires a deliberate storage migration, not a data edit.
  assert.equal(
    createHash("sha256").update(ids.join("\n")).digest("hex"),
    "1f7ca8a4bfac3102ed954486a717582c7d1cbad9cb9af555ba5f2cd5dd32c11e",
  );
});

test("joyo kanji includes all 2,136 characters in the current school grade groups", () => {
  assert.equal(joyoKanji.venue_type, "joyo-kanji");
  assert.ok(joyoKanji.label_ja.trim());
  assert.ok(joyoKanji.label_ko.trim());
  validateCatalog(joyoKanji, true);
  assert.deepEqual(
    joyoKanji.categories.map(({ id, items }) => [id, items.length]),
    [
      ["grade-1", 80],
      ["grade-2", 160],
      ["grade-3", 200],
      ["grade-4", 202],
      ["grade-5", 193],
      ["grade-6", 191],
      ["secondary", 1110],
    ],
  );

  const items = joyoKanji.categories.flatMap((category) => category.items);
  assert.equal(items.length, 2_136);
  const terms = new Set(items.map((item) => item.term));
  assert.equal(terms.size, 2_136, "every kanji must have exactly one row");
  // Independent Unihan kJoyoKanji=2010 repertoire, in numeric codepoint order.
  assert.equal(
    createHash("sha256").update(joyoRepertoire).digest("hex"),
    "3fa93c1d4f65fd4dc43b8b608110743bb29eb6759cc513a7ad24bb684b2bc2ea",
  );
  assert.equal(
    [...terms].sort((left, right) => left.codePointAt(0) - right.codePointAt(0)).join(""),
    joyoRepertoire,
    "catalog differs from the complete official repertoire",
  );

  for (const item of items) {
    assert.equal([...item.term].length, 1, `not one Unicode character: ${item.id}`);
    assert.match(item.term, /^\p{Script=Han}$/u, `not a kanji: ${item.id}`);
    assert.equal(item.id, `joyo-u${item.term.codePointAt(0).toString(16)}`);
    assert.match(item.reading, /[\p{Script=Hiragana}\p{Script=Katakana}]/u);
    assert.ok(Array.isArray(item.reading_on), `missing on readings: ${item.id}`);
    assert.ok(Array.isArray(item.reading_kun), `missing kun readings: ${item.id}`);
    assert.ok(item.reading_on.length + item.reading_kun.length > 0);
    for (const reading of [...item.reading_on, ...item.reading_kun]) {
      assert.match(reading, /[\p{Script=Hiragana}\p{Script=Katakana}]/u);
      assert.ok(!containsCjkIdeograph(reading));
      assert.ok(item.reading.includes(reading), `missing full reading: ${item.id}`);
    }
    assert.match(item.meaning_ko, /[가-힣]/u, `missing Korean meaning: ${item.id}`);
    for (const alias of item.aliases ?? []) {
      assert.equal(typeof alias, "string");
      assert.ok(alias.trim(), `empty alias: ${item.id}`);
    }
  }

  for (const term of ["鬱", "熊", "韓", "藤"]) {
    assert.ok(terms.has(term), `missing 2010 addition: ${term}`);
  }
  for (const term of ["𠮟", "塡", "頰", "剝"]) {
    assert.ok(terms.has(term), `missing official kanji form: ${term}`);
  }
  for (const term of ["叱", "填", "頬", "剥"]) {
    assert.ok(!terms.has(term), `variant must not replace the official form: ${term}`);
  }
  for (const term of ["勺", "銑", "脹", "錘", "匁"]) {
    assert.ok(!terms.has(term), `removed kanji still present: ${term}`);
  }
});

test("menu and kanji progress IDs never collide", () => {
  const ids = [...library, joyoKanji]
    .flatMap((catalog) => catalog.categories)
    .flatMap((category) => category.items.map((item) => item.id));
  assert.equal(ids.length, 3_712);
  assert.equal(new Set(ids).size, ids.length);
});
