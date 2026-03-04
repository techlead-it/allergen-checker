import { useState } from "react";
import { availableIngredients as initialIngredients } from "../data/mock";
import type { Ingredient } from "../data/types";

const STORAGE_KEY = "ingredients";

function loadFromStorage(): Ingredient[] {
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

function saveToStorage(items: Ingredient[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useIngredients() {
  const [ingredients, setIngredientsState] = useState<Ingredient[]>(loadFromStorage);

  function setIngredients(updater: Ingredient[] | ((prev: Ingredient[]) => Ingredient[])) {
    setIngredientsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveToStorage(next);
      return next;
    });
  }

  return [ingredients, setIngredients] as const;
}
