import { useState } from "react";
import type { TagCategory } from "../data/types";

export type CustomTagItem = {
  name: string;
  category: TagCategory;
};

const STORAGE_KEY = "custom-tags";
const LEGACY_KEY = "custom-allergens";

/** カスタムタグの追加可能カテゴリ */
export const addableCategories: { category: TagCategory; label: string }[] = [
  { category: "allergen_custom", label: "カスタムアレルゲン" },
  { category: "taxonomy", label: "食材分類" },
  { category: "texture", label: "食感" },
  { category: "odor", label: "匂い" },
  { category: "risk", label: "健康リスク" },
];

function loadFromStorage(): CustomTagItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    // 旧形式からの自動移行
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) {
        const migrated: CustomTagItem[] = parsed.map((name: string) => ({
          name,
          category: "allergen_custom" as const,
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        localStorage.removeItem(LEGACY_KEY);
        return migrated;
      }
    }
    return [];
  } catch {
    return [];
  }
}

function saveToStorage(items: CustomTagItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useCustomTags() {
  const [items, setItems] = useState<CustomTagItem[]>(loadFromStorage);

  function add(name: string, category: TagCategory): { ok: boolean; error?: string } {
    const trimmed = name.trim();
    if (!trimmed) {
      return { ok: false, error: "名前を入力してください" };
    }
    if (items.some((i) => i.name === trimmed && i.category === category)) {
      return { ok: false, error: "同名のタグが既に登録されています" };
    }
    const next = [...items, { name: trimmed, category }];
    setItems(next);
    saveToStorage(next);
    return { ok: true };
  }

  function remove(name: string, category: TagCategory) {
    const next = items.filter((i) => !(i.name === name && i.category === category));
    setItems(next);
    saveToStorage(next);
  }

  function getByCategory(category: TagCategory): CustomTagItem[] {
    return items.filter((i) => i.category === category);
  }

  return { items, add, remove, getByCategory } as const;
}
