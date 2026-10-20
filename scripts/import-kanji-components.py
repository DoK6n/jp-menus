#!/usr/bin/env python3
"""Extract finite Japanese glyph-component trees from pinned KanjiVG SVGs.

python scripts/import-kanji-components.py --source-dir <directory> [--download]

This script uses KanjiVG by Ulrich Apel (CC BY-SA 3.0), https://kanjivg.tagaini.net/.
The transformed component/meaning dataset is distributed under CC BY-SA 4.0.
No SVG paths, etymology guesses, or cross-character expansion are generated.
See data/joyo-sources.md for the exact schema, attribution and limitations.
"""

import argparse
import collections
import hashlib
import json
from pathlib import Path
import re
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
KANJIVG_COMMIT = "70a0b7ae0c18ceb5cb358274b029cce0234a43bc"
SOURCES = {
    "kanjivg.zip": {
        "url": f"https://codeload.github.com/KanjiVG/kanjivg/zip/{KANJIVG_COMMIT}",
        "sha256": "d6a17d77902b863d7524e24d11c44ae628c5d5ba4f09cb3af90c1190bf78bcca",
    },
    "hanja.txt": {
        "url": "https://raw.githubusercontent.com/libhangul/libhangul/717409ce61524bb3d8426060a384822f21354c62/data/hanja/hanja.txt",
        "sha256": "b1004034589f1357daaea3534a6136f6b5ef825afa8779886b20f0b7908bbe3b",
    },
    "Unihan.zip": {
        "url": "https://www.unicode.org/Public/18.0.0/ucd/Unihan.zip",
        "sha256": "4c93ea9c1f636451729a840978f1667a53886af37ba854fdcce109721c63d43e",
    },
}
SVG = "{http://www.w3.org/2000/svg}"
KVG = "{http://kanjivg.tagaini.net}"
MAX_DEPTH = 12
POSITION_KO = {
    "top": "위쪽", "bottom": "아래쪽", "left": "왼쪽", "right": "오른쪽", "middle": "가운데",
    "kamae": "둘러싸는 부분", "kamaec": "둘러싸인 안쪽",
    "tare": "위와 왼쪽", "tarec": "위·왼쪽 부분의 안쪽",
    "nyo": "왼쪽과 아래쪽", "nyoc": "왼쪽·아래쪽 부분의 안쪽",
    "⿵A": "위에서 감싸는 부분", "⿵B": "위에서 감싼 안쪽",
    "⿶1": "아래에서 감싼 안쪽", "⿶2": "아래에서 감싸는 부분",
}
REFERENCE = re.compile(r"^(.)[과와의] (?:同字|俗字|略字|古字|本字)$")


def normalize(value):
    return unicodedata.normalize("NFKC", value)


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_korean(source_dir):
    glosses, references = collections.defaultdict(list), collections.defaultdict(list)
    for line in (source_dir / "hanja.txt").read_text(encoding="utf-8").splitlines():
        parts = line.split(":")
        if len(parts) < 3 or len(parts[1]) != 1 or not parts[2]:
            continue
        glyph = normalize(parts[1])
        clauses = []
        for clause in parts[2].split(","):
            clause = clause.strip()
            reference = REFERENCE.fullmatch(clause)
            if reference:
                references[glyph].append(normalize(reference[1]))
            elif clause:
                clauses.append(clause)
        if clauses:
            glosses[glyph].append(", ".join(clauses))
    return {g: " / ".join(dict.fromkeys(v)) for g, v in glosses.items()}, references


def read_unihan(source_dir):
    variants = collections.defaultdict(dict)
    wanted = {"kJapaneseOldVariant", "kTraditionalVariant", "kZVariant"}
    with zipfile.ZipFile(source_dir / "Unihan.zip") as archive:
        for name in archive.namelist():
            for line in archive.read(name).decode("utf-8").splitlines():
                if not line or line.startswith("#"):
                    continue
                cp, key, value = line.split("\t")
                if key in wanted:
                    variants[chr(int(cp[2:], 16))][key] = [normalize(chr(int(v, 16))) for v in re.findall(r"U\+([0-9A-F]+)", value)]
    return variants


def meaning_resolver(joyo, glosses, references, variants):
    # Already reviewed Joyo meanings and their explicit one-character aliases
    # take priority over broader Hanja dictionary senses.
    known = {glyph: item["meaning_ko"] for glyph, item in joyo.items()}
    for item in joyo.values():
        for alias in item.get("aliases", []):
            if len(alias) == 1:
                known.setdefault(normalize(alias), item["meaning_ko"])

    def resolve(glyph, seen=frozenset()):
        glyph = normalize(glyph)
        if glyph in seen or len(seen) >= 6:
            return None
        if glyph in known:
            return known[glyph]
        if glyph in glosses:
            return glosses[glyph]
        candidates = list(references.get(glyph, []))
        for prop in ("kJapaneseOldVariant", "kTraditionalVariant", "kZVariant"):
            candidates.extend(variants.get(glyph, {}).get(prop, []))
        for candidate in candidates:
            value = resolve(candidate, seen | {glyph})
            if value:
                return value
        return None

    return resolve


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True, type=Path)
    parser.add_argument("--download", action="store_true")
    args = parser.parse_args()
    if args.download:
        args.source_dir.mkdir(parents=True, exist_ok=True)
        for filename, source in SOURCES.items():
            urllib.request.urlretrieve(source["url"], args.source_dir / filename)
    for filename, source in SOURCES.items():
        assert sha256(args.source_dir / filename) == source["sha256"], f"Unverified source: {filename}"

    catalog_path = ROOT / "data/joyo_kanji.json"
    catalog_hash = sha256(catalog_path)
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    joyo = {item["term"]: item for category in catalog["categories"] for item in category["items"]}
    assert len(joyo) == 2136
    glosses, references = read_korean(args.source_dir)
    meaning_for = meaning_resolver(joyo, glosses, references, read_unihan(args.source_dir))
    entries, source_svgs = {}, {}
    absent_meanings = collections.Counter()
    unknown_wrappers = collections.Counter()
    stats = collections.Counter()

    def components(group, depth=0):
        assert depth <= MAX_DEPTH, "Unexpectedly deep source group tree"
        result, ungrouped = [], 0
        for element in group:
            if element.tag == SVG + "path":
                ungrouped += 1
                continue
            if element.tag != SVG + "g":
                continue
            character = element.get(KVG + "element", "")
            children, remainder = components(element, depth + 1)
            stroke_count = remainder + sum(child["stroke_count"] for child in children)
            if len(character) != 1:
                # Unnamed and non-Unicode CDP-ID wrappers are not glyphs. Keep
                # their named descendants and account for any remaining paths.
                if character:
                    unknown_wrappers[character] += 1
                result.extend(children)
                ungrouped += remainder
                continue
            assert stroke_count > 0, character
            node = {"character": character, "stroke_count": stroke_count, "ungrouped_strokes": remainder}
            original = element.get(KVG + "original")
            assert original is None or len(original) == 1, original
            if original and original != character:
                node["original"] = original
            meaning = meaning_for(original or character)
            if meaning:
                node["meaning_ko"] = meaning
                stats["nodes_with_meaning"] += 1
            else:
                absent_meanings[original or character] += 1
            position = element.get(KVG + "position")
            if position:
                assert position in POSITION_KO, position
                node["position_ko"] = POSITION_KO[position]
            part = element.get(KVG + "part")
            if part is not None:
                assert part.isdigit() and int(part) > 0, part
                node["part"] = int(part)
            if element.get(KVG + "partial") == "true" or part is not None:
                node["partial"] = True
                stats["partial_nodes"] += 1
            if children:
                node["children"] = children
            result.append(node)
            stats["component_nodes"] += 1
        return result, ungrouped

    with zipfile.ZipFile(args.source_dir / "kanjivg.zip") as archive:
        prefix = f"kanjivg-{KANJIVG_COMMIT}/kanji/"
        for character in sorted(joyo):
            filename = f"{ord(character):05x}.svg"
            svg = archive.read(prefix + filename)
            source_svgs[character] = hashlib.sha256(svg).hexdigest()
            document = ET.fromstring(svg)
            root = next(g for g in document.iter(SVG + "g") if g.get(KVG + "element") == character)
            children, remainder = components(root)
            stroke_count = sum(1 for path in root.iter(SVG + "path"))
            assert stroke_count == remainder + sum(c["stroke_count"] for c in children), character
            assert len({path.get("id") for path in root.iter(SVG + "path")}) == stroke_count
            entries[character] = {"components": children, "stroke_count": stroke_count, "ungrouped_strokes": remainder}
            stats["atomic_entries" if not children else "decomposed_entries"] += 1

    assert set(entries) == set(joyo)
    output = {"schema_version": 1, "entries": entries}
    output_path = ROOT / "data/joyo_components.json"
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")

    def tree_depth(nodes):
        return max((1 + tree_depth(node.get("children", [])) for node in nodes), default=0)

    stats["max_component_depth"] = max(tree_depth(entry["components"]) for entry in entries.values())
    manifest = {
        "schema_version": 1,
        "kanjivg_commit": KANJIVG_COMMIT,
        "kanjivg_commit_date": "2026-09-30",
        "kanjivg_license": "CC-BY-SA-3.0",
        "derived_data_license": "CC-BY-SA-4.0",
        "source_files": SOURCES,
        "joyo_catalog_sha256": catalog_hash,
        "output_sha256": sha256(output_path),
        "entry_count": len(entries),
        "statistics": dict(stats),
        "missing_meanings": {key: absent_meanings[key] for key in sorted(absent_meanings)},
        "transparent_non_unicode_wrappers": dict(unknown_wrappers),
        "source_svg_sha256": source_svgs,
    }
    (ROOT / "data/joyo-component-source-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    assert sha256(catalog_path) == catalog_hash, "The authored Joyo catalog must not change"
    print(json.dumps({"entries": len(entries), **dict(stats), "missing_meaning_glyphs": len(absent_meanings), "missing_meaning_nodes": sum(absent_meanings.values()), "bytes": output_path.stat().st_size}, ensure_ascii=False))


if __name__ == "__main__":
    main()
