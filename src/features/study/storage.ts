const STORAGE_KEY = "jp-menus.study.v1.sushi";

interface StoredProgress {
  schema_version: number;
  mastered_ids: string[];
}

export function loadMasteredIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();

    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    if (parsed.schema_version !== 1 || !Array.isArray(parsed.mastered_ids)) {
      return new Set();
    }

    return new Set(parsed.mastered_ids.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function saveMasteredIds(masteredIds: ReadonlySet<string>): void {
  try {
    const progress: StoredProgress = {
      schema_version: 1,
      mastered_ids: [...masteredIds],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage can be unavailable in private or quota-restricted contexts.
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Keep the in-memory reset usable even when storage is unavailable.
  }
}
