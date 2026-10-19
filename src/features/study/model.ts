export type Commonness = "core" | "common" | "specialty";

export interface MenuItem {
  id: string;
  term: string;
  reading: string;
  reading_on?: string[];
  reading_kun?: string[];
  meaning_ko: string;
  aliases?: string[];
  note_ko?: string;
  commonness: Commonness;
}

export interface MenuCategory {
  id: string;
  label_ja: string;
  label_ko: string;
  items: MenuItem[];
}

export interface MenuCatalog {
  schema_version: number;
  venue_type: string;
  label_ja: string;
  label_ko: string;
  categories: MenuCategory[];
}

export interface DisplayGroup extends Omit<MenuCategory, "items"> {
  items: MenuItem[];
}

export interface CellDetail {
  label: string;
  value: string;
}

export type StudyColumn = "term" | "reading" | "meaning";

export type StudyScreen = "menus" | "kanji";

export const studyColumnLabels: Record<StudyScreen, Record<StudyColumn, string>> = {
  menus: { term: "한자·표기", reading: "후리가나", meaning: "한국어 뜻" },
  kanji: { term: "한자", reading: "음독·훈독", meaning: "한국어 뜻" },
};
