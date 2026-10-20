import joyoComponentsJson from "../../data/joyo_components.json";

export interface KanjiComponentNode {
  character: string;
  meaning_ko?: string;
  original?: string;
  position_ko?: string;
  partial?: boolean;
  part?: number;
  stroke_count: number;
  ungrouped_strokes: number;
  children?: KanjiComponentNode[];
}

export interface KanjiComponentEntry {
  components: KanjiComponentNode[];
  stroke_count: number;
  ungrouped_strokes: number;
}

interface KanjiComponentCatalog {
  schema_version: number;
  entries: Record<string, KanjiComponentEntry>;
}

const catalog = joyoComponentsJson as KanjiComponentCatalog;

export function kanjiComponentsFor(character: string): KanjiComponentEntry | undefined {
  const entry = catalog.entries?.[character];
  return entry && Array.isArray(entry.components) ? entry : undefined;
}
