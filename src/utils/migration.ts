import type { Ingredient, Customer, Recipe } from "../data/types";
import { findTagByName } from "../data/tags";

/** 旧形式 Ingredient の型（localStorage に残っている可能性がある） */
type LegacyIngredient = {
  id: number;
  name: string;
  category: "主食材" | "調味料" | "共通仕込み";
  allergens?: string[];
  allergenUnknown?: boolean;
  tags?: Ingredient["tags"];
};

/** 旧形式 Customer の型（localStorage に残っている可能性がある） */
type LegacyCustomer = {
  id: number;
  name: string;
  allergens?: string[];
  condition: string;
  contamination: string;
  checkInDate: string;
  roomName: string;
  notes: string;
  originalText: string;
  restrictions?: Customer["restrictions"];
  presets?: string[];
};

/** 旧形式 Recipe の型（localStorage に残っている可能性がある） */
type LegacyRecipe = {
  id: number;
  name: string;
  version: string;
  linkedIngredients: LegacyIngredient[];
  ingredientLinks?: Recipe["ingredientLinks"];
};

/**
 * 旧形式の Ingredient（tags なし）を新形式に変換する。
 * tags が既に存在する場合はそのまま返す。
 */
export function migrateIngredient(ingredient: LegacyIngredient): Ingredient {
  if (ingredient.tags) {
    return {
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category,
      tags: ingredient.tags,
    };
  }

  const confirmed = !ingredient.allergenUnknown;
  const allergens = ingredient.allergens ?? [];
  const tags = allergens.map((name) => {
    const tag = findTagByName(name);
    return {
      tagId: tag?.id ?? `unknown.${name}`,
      source: "master" as const,
      confirmed,
    };
  });

  return { id: ingredient.id, name: ingredient.name, category: ingredient.category, tags };
}

/**
 * 旧形式の Customer（restrictions なし）を新形式に変換する。
 * restrictions が既に存在する場合はそのまま返す。
 */
export function migrateCustomer(customer: LegacyCustomer): Customer {
  if (customer.restrictions) {
    return {
      id: customer.id,
      name: customer.name,
      condition: customer.condition,
      contamination: customer.contamination,
      checkInDate: customer.checkInDate,
      roomName: customer.roomName,
      notes: customer.notes,
      originalText: customer.originalText,
      restrictions: customer.restrictions,
      presets: customer.presets ?? [],
    };
  }

  const allergens = customer.allergens ?? [];
  const restrictions = allergens.map((name) => {
    const tag = findTagByName(name);
    return {
      tagId: tag?.id ?? `unknown.${name}`,
      source: "self_report" as const,
    };
  });

  return {
    id: customer.id,
    name: customer.name,
    condition: customer.condition,
    contamination: customer.contamination,
    checkInDate: customer.checkInDate,
    roomName: customer.roomName,
    notes: customer.notes,
    originalText: customer.originalText,
    restrictions,
    presets: customer.presets ?? [],
  };
}

/**
 * 旧形式の Recipe（ingredientLinks なし）を新形式に変換する。
 * ingredientLinks が既に存在する場合はそのまま返す。
 */
export function migrateRecipe(recipe: LegacyRecipe): Recipe {
  const linkedIngredients = recipe.linkedIngredients.map(migrateIngredient);

  if (recipe.ingredientLinks) {
    return { ...recipe, linkedIngredients, ingredientLinks: recipe.ingredientLinks };
  }

  const ingredientLinks = recipe.linkedIngredients.map((ing) => ({
    ingredientId: ing.id,
    cookingState: "cooked" as const,
  }));

  return { ...recipe, linkedIngredients, ingredientLinks };
}
