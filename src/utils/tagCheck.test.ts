import { describe, it, expect } from "vitest";
import type {
  Tag,
  TagAttachment,
  CustomerRestriction,
  CookingStateRule,
  CookingState,
} from "../data/types";
import { checkIngredientByTags, checkDishByTags } from "./tagCheck";
import type { DishIngredientInput } from "./tagCheck";

// ─── テスト用タグマスタ（最小限） ───

const testTags: Tag[] = [
  {
    id: "allergen.shrimp",
    name: "えび",
    category: "allergen_mandatory",
    displayPriority: "critical",
    parentTagId: "tax.crustacean",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "allergen.crab",
    name: "かに",
    category: "allergen_mandatory",
    displayPriority: "critical",
    parentTagId: "tax.crustacean",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "allergen.egg",
    name: "卵",
    category: "allergen_mandatory",
    displayPriority: "critical",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "allergen.soybean",
    name: "大豆",
    category: "allergen_recommended",
    displayPriority: "high",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "tax.crustacean",
    name: "甲殻類",
    category: "taxonomy",
    displayPriority: "high",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "tax.animal_product",
    name: "動物性食品",
    category: "taxonomy",
    displayPriority: "normal",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "tax.meat",
    name: "肉類",
    category: "taxonomy",
    displayPriority: "normal",
    parentTagId: "tax.animal_product",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "tex.nebaNeba",
    name: "ネバネバ",
    category: "texture",
    displayPriority: "normal",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "risk.listeria",
    name: "リステリアリスク",
    category: "risk",
    displayPriority: "critical",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "risk.toxoplasma",
    name: "トキソプラズマリスク",
    category: "risk",
    displayPriority: "critical",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "risk.mercury",
    name: "高水銀",
    category: "risk",
    displayPriority: "critical",
    synonyms: [],
    isSystemDefined: true,
  },
];

const testCookingStateRules: CookingStateRule[] = [
  {
    condition: { cookingState: "raw", requiresTag: "tax.animal_product" },
    derivedTagId: "risk.listeria",
  },
  {
    condition: { cookingState: "semi_raw", requiresTag: "tax.meat" },
    derivedTagId: "risk.toxoplasma",
  },
];

// ─── ヘルパー ───

type IngredientInput = {
  tags: TagAttachment[];
  cookingState: CookingState;
  restrictions: CustomerRestriction[];
};

function check(input: IngredientInput) {
  return checkIngredientByTags(
    input.tags,
    input.cookingState,
    input.restrictions,
    testTags,
    testCookingStateRules,
  );
}

// ─── テスト ───

describe("checkIngredientByTags", () => {
  it("returns NG with matched reasons when tag matches customer restriction", () => {
    const result = check({
      tags: [{ tagId: "allergen.shrimp", source: "master", confirmed: true }],
      cookingState: "cooked",
      restrictions: [{ tagId: "allergen.shrimp", source: "self_report" }],
    });

    expect(result.judgment).toBe("NG");
    expect(result.matchedTagIds).toContain("allergen.shrimp");
    expect(result.matchedReasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tagId: "allergen.shrimp",
          tagName: "えび",
        }),
      ]),
    );
  });

  it("returns OK when no tags match and all tags are confirmed", () => {
    const result = check({
      tags: [{ tagId: "allergen.soybean", source: "master", confirmed: true }],
      cookingState: "cooked",
      restrictions: [{ tagId: "allergen.shrimp", source: "self_report" }],
    });

    expect(result.judgment).toBe("OK");
    expect(result.matchedTagIds).toEqual([]);
    expect(result.matchedReasons).toEqual([]);
  });

  it("returns NG when no tags match but critical tag is unconfirmed (safety side)", () => {
    const result = check({
      tags: [{ tagId: "allergen.egg", source: "ai", confirmed: false }],
      cookingState: "cooked",
      restrictions: [{ tagId: "allergen.shrimp", source: "self_report" }],
    });

    expect(result.judgment).toBe("NG");
    expect(result.matchedTagIds).toEqual([]);
  });

  it("returns 要確認 when no tags match but non-critical tag is unconfirmed", () => {
    const result = check({
      tags: [{ tagId: "allergen.soybean", source: "ai", confirmed: false }],
      cookingState: "cooked",
      restrictions: [{ tagId: "allergen.shrimp", source: "self_report" }],
    });

    expect(result.judgment).toBe("要確認");
    expect(result.matchedTagIds).toEqual([]);
  });

  it("returns NG when customer restricts parent tag and ingredient has child tag (hierarchy inference)", () => {
    // 顧客が「甲殻類（tax.crustacean）」をNG → 「えび（allergen.shrimp）」持つ食材もNG
    const result = check({
      tags: [{ tagId: "allergen.shrimp", source: "master", confirmed: true }],
      cookingState: "cooked",
      restrictions: [{ tagId: "tax.crustacean", source: "self_report" }],
    });

    expect(result.judgment).toBe("NG");
    expect(result.matchedTagIds).toContain("allergen.shrimp");
  });

  it("returns NG when raw animal product triggers listeria risk for pregnant customer", () => {
    // サーモン(raw, tags=[tax.animal_product]) → risk.listeria導出 → 妊婦NG
    const result = check({
      tags: [{ tagId: "tax.animal_product", source: "master", confirmed: true }],
      cookingState: "raw",
      restrictions: [{ tagId: "risk.listeria", source: "preset" }],
    });

    expect(result.judgment).toBe("NG");
    expect(result.matchedTagIds).toContain("risk.listeria");
  });

  it("returns OK when cooked animal product does not trigger listeria risk", () => {
    // サーモン(cooked, tags=[tax.animal_product]) → 導出なし → OK
    const result = check({
      tags: [{ tagId: "tax.animal_product", source: "master", confirmed: true }],
      cookingState: "cooked",
      restrictions: [{ tagId: "risk.listeria", source: "preset" }],
    });

    expect(result.judgment).toBe("OK");
    expect(result.matchedTagIds).toEqual([]);
  });

  it("returns NG when multiple tags match restrictions", () => {
    const result = check({
      tags: [
        { tagId: "allergen.shrimp", source: "master", confirmed: true },
        { tagId: "tex.nebaNeba", source: "manual", confirmed: true },
      ],
      cookingState: "cooked",
      restrictions: [
        { tagId: "allergen.shrimp", source: "self_report" },
        { tagId: "tex.nebaNeba", source: "self_report" },
      ],
    });

    expect(result.judgment).toBe("NG");
    expect(result.matchedTagIds).toContain("allergen.shrimp");
    expect(result.matchedTagIds).toContain("tex.nebaNeba");
    expect(result.matchedReasons).toHaveLength(2);
  });

  it("returns OK when ingredient has no tags and no restrictions", () => {
    const result = check({
      tags: [],
      cookingState: "cooked",
      restrictions: [],
    });

    expect(result.judgment).toBe("OK");
    expect(result.matchedTagIds).toEqual([]);
  });

  it("includes tag category in matched reasons", () => {
    const result = check({
      tags: [{ tagId: "allergen.shrimp", source: "master", confirmed: true }],
      cookingState: "cooked",
      restrictions: [{ tagId: "allergen.shrimp", source: "self_report" }],
    });

    expect(result.matchedReasons[0]).toEqual(
      expect.objectContaining({
        tagId: "allergen.shrimp",
        tagName: "えび",
        category: "allergen_mandatory",
      }),
    );
  });

  it("returns NG when semi_raw meat triggers toxoplasma risk for pregnant customer", () => {
    const result = check({
      tags: [{ tagId: "tax.meat", source: "master", confirmed: true }],
      cookingState: "semi_raw",
      restrictions: [{ tagId: "risk.toxoplasma", source: "preset" }],
    });

    expect(result.judgment).toBe("NG");
    expect(result.matchedTagIds).toContain("risk.toxoplasma");
  });

  it("returns derivedTagIds containing tags derived from cooking state rules", () => {
    const result = check({
      tags: [{ tagId: "tax.animal_product", source: "master", confirmed: true }],
      cookingState: "raw",
      restrictions: [],
    });

    expect(result.derivedTagIds).toContain("risk.listeria");
  });

  it("returns empty derivedTagIds when no cooking state rule applies", () => {
    const result = check({
      tags: [{ tagId: "allergen.soybean", source: "master", confirmed: true }],
      cookingState: "cooked",
      restrictions: [],
    });

    expect(result.derivedTagIds).toEqual([]);
  });

  it("includes derived tags in matchedTagIds when they match customer restrictions", () => {
    const result = check({
      tags: [{ tagId: "tax.animal_product", source: "master", confirmed: true }],
      cookingState: "raw",
      restrictions: [{ tagId: "risk.listeria", source: "preset" }],
    });

    expect(result.derivedTagIds).toContain("risk.listeria");
    expect(result.matchedTagIds).toContain("risk.listeria");
    expect(result.matchedReasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tagId: "risk.listeria",
          tagName: "リステリアリスク",
          category: "risk",
        }),
      ]),
    );
  });
});

// ─── checkDishByTags テスト ───

function checkDish(
  ingredients: DishIngredientInput[],
  restrictions: CustomerRestriction[],
  excludedIngredientIds?: number[],
) {
  return checkDishByTags(
    ingredients,
    restrictions,
    testTags,
    testCookingStateRules,
    excludedIngredientIds,
  );
}

describe("checkDishByTags", () => {
  it("returns OK when all ingredients are OK", () => {
    const result = checkDish(
      [
        {
          ingredientId: 1,
          tags: [{ tagId: "allergen.soybean", source: "master", confirmed: true }],
          cookingState: "cooked",
        },
        {
          ingredientId: 2,
          tags: [{ tagId: "allergen.egg", source: "master", confirmed: true }],
          cookingState: "cooked",
        },
      ],
      [{ tagId: "allergen.shrimp", source: "self_report" }],
    );

    expect(result.judgment).toBe("OK");
    expect(result.matchedTagIds).toEqual([]);
  });

  it("returns NG when one ingredient is NG (NG takes priority)", () => {
    const result = checkDish(
      [
        {
          ingredientId: 1,
          tags: [{ tagId: "allergen.shrimp", source: "master", confirmed: true }],
          cookingState: "cooked",
        },
        {
          ingredientId: 2,
          tags: [{ tagId: "allergen.soybean", source: "master", confirmed: true }],
          cookingState: "cooked",
        },
      ],
      [{ tagId: "allergen.shrimp", source: "self_report" }],
    );

    expect(result.judgment).toBe("NG");
    expect(result.matchedTagIds).toContain("allergen.shrimp");
  });

  it("returns 要確認 when one ingredient is 要確認 and rest are OK", () => {
    const result = checkDish(
      [
        {
          ingredientId: 1,
          tags: [{ tagId: "allergen.soybean", source: "ai", confirmed: false }],
          cookingState: "cooked",
        },
        {
          ingredientId: 2,
          tags: [{ tagId: "allergen.egg", source: "master", confirmed: true }],
          cookingState: "cooked",
        },
      ],
      [{ tagId: "allergen.shrimp", source: "self_report" }],
    );

    expect(result.judgment).toBe("要確認");
  });

  it("excludes ingredients by excludedIngredientIds from judgment", () => {
    const result = checkDish(
      [
        {
          ingredientId: 1,
          tags: [{ tagId: "allergen.shrimp", source: "master", confirmed: true }],
          cookingState: "cooked",
        },
        {
          ingredientId: 2,
          tags: [{ tagId: "allergen.soybean", source: "master", confirmed: true }],
          cookingState: "cooked",
        },
      ],
      [{ tagId: "allergen.shrimp", source: "self_report" }],
      [1], // えびの食材を除外
    );

    expect(result.judgment).toBe("OK");
    expect(result.matchedTagIds).toEqual([]);
  });

  it("aggregates matched reasons from multiple ingredients", () => {
    const result = checkDish(
      [
        {
          ingredientId: 1,
          tags: [{ tagId: "allergen.shrimp", source: "master", confirmed: true }],
          cookingState: "cooked",
        },
        {
          ingredientId: 2,
          tags: [{ tagId: "tex.nebaNeba", source: "manual", confirmed: true }],
          cookingState: "cooked",
        },
      ],
      [
        { tagId: "allergen.shrimp", source: "self_report" },
        { tagId: "tex.nebaNeba", source: "self_report" },
      ],
    );

    expect(result.judgment).toBe("NG");
    expect(result.matchedTagIds).toContain("allergen.shrimp");
    expect(result.matchedTagIds).toContain("tex.nebaNeba");
    expect(result.matchedReasons).toHaveLength(2);
  });

  it("returns per-ingredient results", () => {
    const result = checkDish(
      [
        {
          ingredientId: 1,
          tags: [{ tagId: "allergen.shrimp", source: "master", confirmed: true }],
          cookingState: "cooked",
        },
        {
          ingredientId: 2,
          tags: [{ tagId: "allergen.soybean", source: "master", confirmed: true }],
          cookingState: "cooked",
        },
      ],
      [{ tagId: "allergen.shrimp", source: "self_report" }],
    );

    expect(result.ingredientResults).toHaveLength(2);
    expect(result.ingredientResults[0].ingredientId).toBe(1);
    expect(result.ingredientResults[0].judgment).toBe("NG");
    expect(result.ingredientResults[1].ingredientId).toBe(2);
    expect(result.ingredientResults[1].judgment).toBe("OK");
  });

  it("deduplicates matched tag IDs across ingredients", () => {
    // 2つの食材が同じタグでマッチ → matchedTagIds は重複なし
    const result = checkDish(
      [
        {
          ingredientId: 1,
          tags: [{ tagId: "allergen.shrimp", source: "master", confirmed: true }],
          cookingState: "cooked",
        },
        {
          ingredientId: 2,
          tags: [{ tagId: "allergen.shrimp", source: "master", confirmed: true }],
          cookingState: "cooked",
        },
      ],
      [{ tagId: "allergen.shrimp", source: "self_report" }],
    );

    expect(result.matchedTagIds).toEqual(["allergen.shrimp"]);
  });

  it("returns OK when all ingredients are excluded", () => {
    const result = checkDish(
      [
        {
          ingredientId: 1,
          tags: [{ tagId: "allergen.shrimp", source: "master", confirmed: true }],
          cookingState: "cooked",
        },
      ],
      [{ tagId: "allergen.shrimp", source: "self_report" }],
      [1],
    );

    expect(result.judgment).toBe("OK");
    expect(result.ingredientResults).toEqual([]);
  });
});
