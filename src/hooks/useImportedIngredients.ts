import { useState } from "react";
import { importedIngredients as initialIngredients } from "../data/mock";
import type { ImportedIngredient } from "../data/types";

const STORAGE_KEY = "imported-ingredients";

function loadFromStorage(): ImportedIngredient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialIngredients;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return initialIngredients;
  } catch {
    return initialIngredients;
  }
}

function saveToStorage(items: ImportedIngredient[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useImportedIngredients() {
  const [ingredients, setIngredientsState] = useState<ImportedIngredient[]>(loadFromStorage);

  function setIngredients(
    updater: ImportedIngredient[] | ((prev: ImportedIngredient[]) => ImportedIngredient[]),
  ) {
    setIngredientsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveToStorage(next);
      return next;
    });
  }

  return [ingredients, setIngredients] as const;
}
