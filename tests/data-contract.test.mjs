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
const joyoComponents = JSON.parse(
  await readFile(new URL("data/joyo_components.json", projectUrl), "utf8"),
);
const componentSources = JSON.parse(
  await readFile(new URL("data/joyo-component-source-manifest.json", projectUrl), "utf8"),
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

test("component entries cover the exact Joyo repertoire and preserve independently counted source strokes", () => {
  assert.equal(joyoComponents.schema_version, 1);
  const characters = Object.keys(joyoComponents.entries)
    .sort((left, right) => left.codePointAt(0) - right.codePointAt(0));
  assert.equal(characters.length, 2_136);
  assert.equal(characters.join(""), joyoRepertoire);

  assert.equal(componentSources.schema_version, 1);
  assert.equal(componentSources.kanjivg_commit, "70a0b7ae0c18ceb5cb358274b029cce0234a43bc");
  assert.equal(componentSources.kanjivg_license, "CC-BY-SA-3.0");
  assert.equal(
    componentSources.source_files["kanjivg.zip"].sha256,
    "d6a17d77902b863d7524e24d11c44ae628c5d5ba4f09cb3af90c1190bf78bcca",
  );
  assert.deepEqual(new Set(Object.keys(componentSources.source_svg_sha256)), new Set(characters));
  for (const hash of Object.values(componentSources.source_svg_sha256)) {
    assert.match(hash, /^[0-9a-f]{64}$/u);
  }

  // Independently counted <path> elements in all 2,136 SVGs of the pinned archive.
  // UTF-8 records: lowercase codepoint hex + ':' + count, numeric codepoint order, LF separated.
  const strokeCounts = characters.map((character) =>
    `${character.codePointAt(0).toString(16)}:${joyoComponents.entries[character].stroke_count}`,
  ).join("\n");
  assert.equal(
    createHash("sha256").update(strokeCounts).digest("hex"),
    "efe5213fbf1b768e1f2b97964590e646b83b5c2c74fd359da63e0990c967a2eb",
  );
});

test("every recursive component accounts for its strokes and retains truthful optional metadata", () => {
  const statistics = {
    atomic_entries: 0,
    nodes_with_meaning: 0,
    component_nodes: 0,
    decomposed_entries: 0,
    partial_nodes: 0,
    max_component_depth: 0,
  };
  const missingMeanings = {};

  function validateStrokePartition(group, children, path) {
    assert.ok(Number.isInteger(group.stroke_count) && group.stroke_count > 0, `invalid stroke count: ${path}`);
    assert.ok(Number.isInteger(group.ungrouped_strokes) && group.ungrouped_strokes >= 0, `invalid ungrouped strokes: ${path}`);
    assert.ok(Array.isArray(children), `invalid children: ${path}`);
    assert.equal(
      group.stroke_count,
      group.ungrouped_strokes + children.reduce((total, child) => total + child.stroke_count, 0),
      `lost or duplicated strokes: ${path}`,
    );
  }

  function visit(node, path, depth) {
    statistics.component_nodes += 1;
    statistics.max_component_depth = Math.max(statistics.max_component_depth, depth);
    assert.ok(depth <= 8, `unexpectedly deep component tree: ${path}`);
    // KanjiVG also names kana-shaped components such as マ and つ.
    assert.equal(typeof node.character, "string");
    assert.equal([...node.character].length, 1, `invalid component character: ${path}`);
    if (node.original !== undefined) {
      assert.equal(typeof node.original, "string");
      assert.equal([...node.original].length, 1, `invalid original form: ${path}`);
    }
    if (node.meaning_ko !== undefined) {
      assert.equal(typeof node.meaning_ko, "string");
      assert.match(node.meaning_ko, /[가-힣]/u, `invalid Korean meaning: ${path}`);
      statistics.nodes_with_meaning += 1;
    } else {
      const meaningKey = node.original ?? node.character;
      missingMeanings[meaningKey] = (missingMeanings[meaningKey] ?? 0) + 1;
    }
    if (node.position_ko !== undefined) assert.match(node.position_ko, /[가-힣]/u);
    if (node.partial !== undefined) assert.equal(typeof node.partial, "boolean");
    if (node.partial) statistics.partial_nodes += 1;
    if (node.part !== undefined) {
      assert.ok(Number.isInteger(node.part) && node.part > 0, `invalid split part: ${path}`);
      assert.equal(node.partial, true, `split component must be marked partial: ${path}`);
    }
    const children = node.children ?? [];
    validateStrokePartition(node, children, path);
    children.forEach((child, index) => visit(child, `${path}/${index}:${child.character}`, depth + 1));
  }

  for (const [character, entry] of Object.entries(joyoComponents.entries)) {
    validateStrokePartition(entry, entry.components, character);
    if (entry.components.length) statistics.decomposed_entries += 1;
    else statistics.atomic_entries += 1;
    entry.components.forEach((node, index) => visit(node, `${character}/${index}:${node.character}`, 1));
  }

  // Independent raw-SVG traversal counts every named single-codepoint group below each root.
  assert.equal(statistics.component_nodes, 10_699);
  assert.equal(statistics.atomic_entries, 66);
  assert.equal(statistics.decomposed_entries, 2_070);
  assert.equal(statistics.max_component_depth, 7);
  assert.deepEqual(statistics, componentSources.statistics);
  assert.deepEqual(missingMeanings, componentSources.missing_meanings);
});

test("source examples retain variants, nested components, split parts and atomic boundaries", () => {
  const entries = joyoComponents.entries;
  assert.deepEqual(entries["休"].components.map(({ character, original, stroke_count }) =>
    [character, original ?? null, stroke_count]), [["亻", "人", 2], ["木", null, 4]]);
  assert.match(entries["休"].components[0].meaning_ko, /사람/u);
  assert.match(entries["休"].components[1].meaning_ko, /나무/u);
  assert.equal(entries["休"].stroke_count, 6);

  assert.deepEqual(entries["森"].components.map(({ character }) => character), ["木", "林"]);
  assert.deepEqual(entries["森"].components[1].children.map(({ character }) => character), ["木", "木"]);
  assert.equal(entries["森"].stroke_count, 12);
  assert.deepEqual(entries["国"].components.map(({ character, part, partial }) =>
    [character, part ?? null, partial ?? false]), [["囗", 1, true], ["玉", null, false], ["囗", 2, true]]);
  assert.equal(entries["国"].stroke_count, 8);
  assert.deepEqual(entries["一"], { components: [], stroke_count: 1, ungrouped_strokes: 1 });
  assert.deepEqual(entries["生"], { components: [], stroke_count: 5, ungrouped_strokes: 5 });
  assert.equal(entries["鬱"].stroke_count, 29);
  const aromaticWine = entries["鬱"].components.find(({ character }) => character === "鬯");
  assert.equal(aromaticWine.ungrouped_strokes, 6);
  assert.deepEqual(aromaticWine.children.map(({ character }) => character), ["凵", "匕"]);
});
