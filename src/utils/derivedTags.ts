import type { CookingState, CookingStateRule } from "../data/types";

/**
 * 調理状態と食材のタグIDから、導出されるタグIDのリストを返す。
 * 例: raw + animal_product → risk.listeria
 */
export function getDerivedTagIds(
  cookingState: CookingState,
  ingredientTagIds: string[],
  rules: CookingStateRule[],
): string[] {
  const derived: string[] = [];
  for (const rule of rules) {
    if (rule.condition.cookingState !== cookingState) continue;
    if (rule.condition.requiresTag && !ingredientTagIds.includes(rule.condition.requiresTag))
      continue;
    derived.push(rule.derivedTagId);
  }
  return derived;
}
