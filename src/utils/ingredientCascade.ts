import type { Ingredient, Recipe } from "../data/types";

/** 食材更新を全レシピの linkedIngredients に反映 */
export function syncIngredientInRecipes(recipes: Recipe[], updated: Ingredient): Recipe[] {
  return recipes.map((recipe) => {
    const hasIngredient = recipe.linkedIngredients.some((i) => i.id === updated.id);
    if (!hasIngredient) return recipe;
    return {
      ...recipe,
      linkedIngredients: recipe.linkedIngredients.map((i) =>
        i.id === updated.id ? { ...updated } : i,
      ),
    };
  });
}

/** 食材を使用しているレシピ数をカウント */
export function countIngredientUsage(recipes: Recipe[], ingredientId: number): number {
  return recipes.filter((r) => r.linkedIngredients.some((i) => i.id === ingredientId)).length;
}

/** 食材を使用しているレシピ名を取得 */
export function getIngredientUsageNames(recipes: Recipe[], ingredientId: number): string[] {
  return recipes
    .filter((r) => r.linkedIngredients.some((i) => i.id === ingredientId))
    .map((r) => r.name);
}
