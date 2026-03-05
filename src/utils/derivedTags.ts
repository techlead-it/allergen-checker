import type { CookingState, CookingStateRule } from "../data/types";

/** 導出されたタグとその導出文脈 */
export type DerivedTagResult = {
  tagId: string;
  sourceTagId: string;
  cookingState: CookingState;
  description: string;
};

/**
 * 調理状態と食材のタグIDから、導出されるタグIDのリストを返す。
 * 例: raw + fish → risk.listeria
 */
export function getDerivedTagIds(
  cookingState: CookingState,
  ingredientTagIds: string[],
  rules: CookingStateRule[],
): string[] {
  return getDerivedTags(cookingState, ingredientTagIds, rules).map((r) => r.tagId);
}

/**
 * 調理状態と食材のタグIDから、導出されるタグとその文脈情報を返す。
 */
export function getDerivedTags(
  cookingState: CookingState,
  ingredientTagIds: string[],
  rules: CookingStateRule[],
): DerivedTagResult[] {
  const results: DerivedTagResult[] = [];
  for (const rule of rules) {
    if (rule.condition.cookingState !== cookingState) continue;
    if (rule.condition.requiresTag && !ingredientTagIds.includes(rule.condition.requiresTag))
      continue;
    results.push({
      tagId: rule.derivedTagId,
      sourceTagId: rule.condition.requiresTag ?? "",
      cookingState,
      description: rule.description,
    });
  }
  return results;
}
