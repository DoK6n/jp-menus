export type Commonness = "core" | "common" | "specialty";

export interface MenuItem {
  id: string;
  term: string;
  reading: string;
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
