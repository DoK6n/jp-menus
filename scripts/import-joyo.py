#!/usr/bin/env python3
"""Import the licensed Joyo study catalog with only the Python standard library.

Usage: python scripts/import-joyo.py --source-dir <directory> [--download]
The directory holds kanjidic2.xml.gz, hanja.txt, and Unihan.zip. Downloads are
explicit, never part of the app build or runtime. See data/joyo-sources.md.
"""

import argparse
import collections
import gzip
import hashlib
import json
from pathlib import Path
import re
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    "kanjidic2.xml.gz": "https://www.edrdg.org/kanjidic/kanjidic2.xml.gz",
    "hanja.txt": "https://raw.githubusercontent.com/libhangul/libhangul/717409ce61524bb3d8426060a384822f21354c62/data/hanja/hanja.txt",
    "Unihan.zip": "https://www.unicode.org/Public/18.0.0/ucd/Unihan.zip",
}
EXPECTED_COUNTS = {"1": 80, "2": 160, "3": 200, "4": 202, "5": 193, "6": 191, "8": 1110}

# Korean dictionary glyphs where an automatic Japanese-old/Z/traditional link
# is absent, and pure cross-reference entries that otherwise lack a gloss.
# These are explicit character mappings, not unrestricted semantic traversal.
KOREAN_GLYPHS = {
    "閲": "閱", "既": "旣", "教": "敎", "歳": "歲", "舎": "舍", "尚": "尙",
    "清": "淸", "青": "靑", "闘": "鬪", "舗": "鋪", "毀": "毁",
    "並": "竝", "仮": "假", "即": "卽", "塩": "鹽", "弥": "彌", "潜": "潛",
    "窃": "竊", "装": "裝", "駄": "馱",
}

# Project-authored Korean translations of the corresponding KANJIDIC2 senses.
# Japanese-made characters and Japanese-specific meanings must not inherit
# unrelated semantic-variant glosses (notably 咲 -> 笑 and 丼 -> 井).
KOREAN_TRANSLATIONS = {
    "込": "붐비다·안으로 들어가다",
    "咲": "꽃이 피다",
    "捗": "일이 진척되다",
    "働": "일하다",
    "枠": "틀·테두리",
    "丼": "사발·덮밥",
    "欧": "유럽",
    "姫": "공주",
    "娘": "딸·소녀",
    "机": "책상·탁자",
    "沖": "먼바다",
}


def unique(values):
    return list(dict.fromkeys(values))


def normalize(value):
    return unicodedata.normalize("NFKC", value)


def hira(value):
    # KANJIDIC dots mark okurigana and hyphens mark bound forms. The visible
    # study value is the complete reading; source notation remains upstream.
    return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in value).replace(".", "").replace("-", "")


def unihan(source_dir):
    result = collections.defaultdict(dict)
    with zipfile.ZipFile(source_dir / "Unihan.zip") as archive:
        for name in archive.namelist():
            for line in archive.read(name).decode("utf-8").splitlines():
                if not line or line.startswith("#"):
                    continue
                cp, key, value = line.split("\t")
                result[chr(int(cp[2:], 16))][key] = value
    return result


def korean_glosses(source_dir):
    result = collections.defaultdict(list)
    for line in (source_dir / "hanja.txt").read_text(encoding="utf-8").splitlines():
        parts = line.split(":")
        if len(parts) < 3 or len(parts[1]) != 1 or not parts[2]:
            continue
        # Strip orthographic cross-reference clauses, retaining actual 훈음.
        clauses = [c.strip() for c in parts[2].split(",")]
        clauses = [c for c in clauses if not re.fullmatch(r".+(?:과|와|의) (?:同字|俗字|略字|古字|本字)", c)]
        if clauses:
            result[normalize(parts[1])].append(", ".join(clauses))
    return {key: unique(values) for key, values in result.items()}


def choose_korean(character, properties, glosses):
    if character in KOREAN_TRANSLATIONS:
        return KOREAN_TRANSLATIONS[character], None, "translated"
    if character in KOREAN_GLYPHS:
        candidate = KOREAN_GLYPHS[character]
        assert candidate in glosses, (character, candidate)
        return " / ".join(glosses[candidate]), candidate, "explicit-glyph"
    if character in glosses:
        return " / ".join(glosses[character]), character, "direct"
    for prop in ("kJapaneseOldVariant", "kTraditionalVariant", "kZVariant"):
        for cp in re.findall(r"U\+([0-9A-F]+)", properties.get(prop, "")):
            candidate = normalize(chr(int(cp, 16)))
            if candidate in glosses:
                return " / ".join(glosses[candidate]), candidate, prop
    raise ValueError(f"No reviewed Korean meaning for {character}")


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True, type=Path)
    parser.add_argument("--download", action="store_true")
    args = parser.parse_args()
    if args.download:
        args.source_dir.mkdir(parents=True, exist_ok=True)
        for filename, url in SOURCES.items():
            urllib.request.urlretrieve(url, args.source_dir / filename)

    unicode_data = unihan(args.source_dir)
    official = {char for char, values in unicode_data.items() if values.get("kJoyoKanji") == "2010"}
    xml = ET.fromstring(gzip.decompress((args.source_dir / "kanjidic2.xml.gz").read_bytes()))
    characters = [char for char in xml.findall("character") if char.findtext("misc/grade") in EXPECTED_COUNTS]
    assert len(official) == 2136
    assert {char.findtext("literal") for char in characters} == official, "KANJIDIC and Unihan Joyo lists differ"
    assert collections.Counter(char.findtext("misc/grade") for char in characters) == EXPECTED_COUNTS
    glosses = korean_glosses(args.source_dir)
    alternate_forms = collections.defaultdict(list)
    for character, properties in unicode_data.items():
        value = properties.get("kJoyoKanji", "")
        if value.startswith("U+"):
            alternate_forms[chr(int(value[2:], 16))].append(character)
    methods = collections.Counter()
    categories = []
    for grade in EXPECTED_COUNTS:
        items = []
        # Unicode codepoint order is explicit and stable; it is not a frequency
        # ranking or the MEXT printed order. Grade membership is authoritative.
        for char in sorted((c for c in characters if c.findtext("misc/grade") == grade), key=lambda c: ord(c.findtext("literal"))):
            literal = char.findtext("literal")
            readings = char.findall("reading_meaning/rmgroup/reading")
            on = unique(hira(r.text) for r in readings if r.get("r_type") == "ja_on")
            kun = unique(hira(r.text) for r in readings if r.get("r_type") == "ja_kun")
            reading = " / ".join(label + ": " + "・".join(values) for label, values in (("음", on), ("훈", kun)) if values)
            meaning, source_glyph, method = choose_korean(literal, unicode_data[literal], glosses)
            methods[method] += 1
            assert reading and re.search(r"[가-힣]", meaning), literal
            aliases = []
            if source_glyph and source_glyph != literal:
                aliases.append(source_glyph)
            aliases.extend(alternate_forms[literal])
            item = {
                "id": f"joyo-u{ord(literal):x}", "term": literal, "reading": reading,
                "reading_on": on, "reading_kun": kun, "meaning_ko": meaning,
                "commonness": "common" if grade == "8" else "core",
            }
            if aliases:
                item["aliases"] = unique(aliases)
            items.append(item)
        categories.append({
            "id": "secondary" if grade == "8" else f"grade-{grade}",
            "label_ja": "中学校以上" if grade == "8" else f"小学{grade}年",
            "label_ko": "중학교 이상" if grade == "8" else f"초등 {grade}학년",
            "items": items,
        })
    catalog = {"schema_version": 1, "venue_type": "joyo-kanji", "label_ja": "常用漢字", "label_ko": "상용한자", "categories": categories}
    repertoire = "".join(sorted(official))
    write_json(ROOT / "data/joyo_kanji.json", catalog)
    (ROOT / "data/joyo-repertoire.txt").write_text(repertoire + "\n", encoding="utf-8", newline="\n")
    manifest = {
        "kanjidic_creation_date": xml.findtext("header/date_of_creation"),
        "kanjidic_database_version": xml.findtext("header/database_version"),
        "unihan_version": "18.0.0",
        "source_files": {name: {"url": url, "sha256": hashlib.sha256((args.source_dir / name).read_bytes()).hexdigest()} for name, url in SOURCES.items()},
        "repertoire_sha256_utf8_no_newline": hashlib.sha256(repertoire.encode("utf-8")).hexdigest(),
        "grade_counts": {category["id"]: len(category["items"]) for category in categories},
        "korean_gloss_methods": dict(methods),
    }
    write_json(ROOT / "data/joyo-source-manifest.json", manifest)
    print(json.dumps({"items": len(characters), "grade_counts": manifest["grade_counts"], "korean_gloss_methods": dict(methods), "repertoire_sha256": manifest["repertoire_sha256_utf8_no_newline"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
