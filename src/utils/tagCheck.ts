import type {
  Tag,
  TagAttachment,
  TagCategory,
  CustomerRestriction,
  CookingState,
  CookingStateRule,
  Judgment,
} from "../data/types";

export function judgmentIcon(j: Judgment) {
  switch (j) {
    case "NG":
      return "✕";
    case "要確認":
      return "△";
    case "OK":
      return "○";
  }
}

/** Recipe から DishIngredientInput[] を構築するヘルパー */
export function buildDishIngredients(recipe: {
  linkedIngredients: { id: number; tags: TagAttachment[] }[];
  ingredientLinks: { ingredientId: number; cookingState: CookingState }[];
}): DishIngredientInput[] {
  return recipe.linkedIngredients.map((ing) => {
    const link = recipe.ingredientLinks.find((l) => l.ingredientId === ing.id);
    return {
      ingredientId: ing.id,
      tags: ing.tags,
      cookingState: link?.cookingState ?? "cooked",
    };
  });
}

/** CustomerRestriction[] からタグ名の配列を取得（UI表示用） */
export function restrictionNames(restrictions: CustomerRestriction[], allTags: Tag[]): string[] {
  return restrictions.map((r) => {
    const tag = allTags.find((t) => t.id === r.tagId);
    return tag?.name ?? r.tagId;
  });
}

/** TagAttachment[] からタグ名の配列を取得（UI表示用） */
export function tagNames(tags: TagAttachment[], allTags: Tag[]): string[] {
  return tags.map((t) => {
    const tag = allTags.find((at) => at.id === t.tagId);
    return tag?.name ?? t.tagId;
  });
}
import { getEffectiveTags } from "./tagHierarchy";
import { getDerivedTagIds } from "./derivedTags";

export type MatchedReason = {
  tagId: string;
  tagName: string;
  category: TagCategory | undefined;
};

export type IngredientCheckResult = {
  judgment: Judgment;
  matchedTagIds: string[];
  matchedReasons: MatchedReason[];
  derivedTagIds: string[];
};

export type DishIngredientInput = {
  ingredientId: number;
  tags: TagAttachment[];
  cookingState: CookingState;
};

export type IngredientResultDetail = {
  ingredientId: number;
  judgment: Judgment;
};

export type DishCheckResult = {
  judgment: Judgment;
  matchedTagIds: string[];
  matchedReasons: MatchedReason[];
  ingredientResults: IngredientResultDetail[];
};

export function checkIngredientByTags(
  ingredientTags: TagAttachment[],
  cookingState: CookingState,
  customerRestrictions: CustomerRestriction[],
  allTags: Tag[],
  cookingStateRules: CookingStateRule[],
): IngredientCheckResult {
  // 1. 食材のタグIDを収集
  const ingredientTagIds = ingredientTags.map((t) => t.tagId);

  // 2. cookingState から導出タグを追加
  const derivedTagIds = getDerivedTagIds(cookingState, ingredientTagIds, cookingStateRules);
  ingredientTagIds.push(...derivedTagIds);

  // 3. 顧客のNG条件を展開（親タグ → 子タグの展開）
  const expandedRestrictionTagIds = new Set<string>();
  for (const restriction of customerRestrictions) {
    for (const effectiveId of getEffectiveTags(restriction.tagId, allTags)) {
      expandedRestrictionTagIds.add(effectiveId);
    }
  }

  // 4. 交差判定
  const matchedTagIds = ingredientTagIds.filter((id) => expandedRestrictionTagIds.has(id));

  // 5. 判定
  let judgment: Judgment;
  if (matchedTagIds.length > 0) {
    judgment = "NG";
  } else {
    const hasUnconfirmedCritical = ingredientTags.some((t) => {
      const tag = allTags.find((at) => at.id === t.tagId);
      return !t.confirmed && tag?.displayPriority === "critical";
    });
    const hasUnconfirmedOther = ingredientTags.some((t) => !t.confirmed);

    if (hasUnconfirmedCritical) {
      judgment = "NG";
    } else if (hasUnconfirmedOther) {
      judgment = "要確認";
    } else {
      judgment = "OK";
    }
  }

  return {
    judgment,
    matchedTagIds,
    matchedReasons: matchedTagIds.map((id) => {
      const tag = allTags.find((t) => t.id === id);
      return {
        tagId: id,
        tagName: tag?.name ?? id,
        category: tag?.category,
      };
    }),
    derivedTagIds,
  };
}

export function checkDishByTags(
  ingredients: DishIngredientInput[],
  customerRestrictions: CustomerRestriction[],
  allTags: Tag[],
  cookingStateRules: CookingStateRule[],
  excludedIngredientIds?: number[],
): DishCheckResult {
  const excludedIds = new Set(excludedIngredientIds ?? []);

  // 除外対象外の食材だけを対象
  const filteredIngredients = ingredients.filter((ing) => !excludedIds.has(ing.ingredientId));

  // 各食材の判定を実行
  const ingredientResults: IngredientResultDetail[] = [];
  const allMatchedTagIds = new Set<string>();
  const allMatchedReasons = new Map<string, MatchedReason>();

  for (const ingredient of filteredIngredients) {
    const result = checkIngredientByTags(
      ingredient.tags,
      ingredient.cookingState,
      customerRestrictions,
      allTags,
      cookingStateRules,
    );

    ingredientResults.push({
      ingredientId: ingredient.ingredientId,
      judgment: result.judgment,
    });

    // マッチしたタグIDと理由を集約
    for (const tagId of result.matchedTagIds) {
      allMatchedTagIds.add(tagId);
    }
    for (const reason of result.matchedReasons) {
      allMatchedReasons.set(reason.tagId, reason);
    }
  }

  // 全体判定（優先度: NG > 要確認 > OK）
  let overallJudgment: Judgment = "OK";
  if (ingredientResults.some((r) => r.judgment === "NG")) {
    overallJudgment = "NG";
  } else if (ingredientResults.some((r) => r.judgment === "要確認")) {
    overallJudgment = "要確認";
  }

  return {
    judgment: overallJudgment,
    matchedTagIds: Array.from(allMatchedTagIds),
    matchedReasons: Array.from(allMatchedReasons.values()),
    ingredientResults,
  };
}
