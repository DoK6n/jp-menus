import additionalCatalogsJson from "../../data/additional_catalogs.json";
import sushiCatalogJson from "../../data/sushi.json";

import type { MenuCatalog } from "../features/study/model";

const sushiCatalog: MenuCatalog = {
  ...(sushiCatalogJson as Omit<MenuCatalog, "label_ja" | "label_ko">),
  label_ja: "寿司",
  label_ko: "스시",
};

export const menuLibrary: MenuCatalog[] = [
  sushiCatalog,
  ...(additionalCatalogsJson as MenuCatalog[]),
];

export function catalogById(id: string): MenuCatalog | undefined {
  return menuLibrary.find((catalog) => catalog.venue_type === id);
}

export function catalogItemCount(catalog: MenuCatalog): number {
  return catalog.categories.reduce((total, category) => total + category.items.length, 0);
}

export const totalItemCount = menuLibrary.reduce(
  (total, catalog) => total + catalogItemCount(catalog),
  0,
);
