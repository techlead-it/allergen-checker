import { describe, it, expect } from "vite-plus/test";
import { migrateIngredient, migrateCustomer, migrateRecipe } from "./migration";

describe("migrateIngredient", () => {
  it("returns ingredient as-is when tags already exist", () => {
    const ing = {
      id: 1,
      name: "車えび",
      category: "主食材" as const,
      allergens: ["えび"],
      tags: [{ tagId: "allergen.shrimp", source: "master" as const, confirmed: true }],
    };
    const result = migrateIngredient(ing);
    expect(result.tags).toEqual(ing.tags);
  });

  it("generates tags from allergens when tags is undefined", () => {
    const ing = {
      id: 3,
      name: "車えび",
      category: "主食材" as const,
      allergens: ["えび"],
    };
    const result = migrateIngredient(ing);
    expect(result.tags).toBeDefined();
    expect(result.tags!.length).toBe(1);
    expect(result.tags![0].tagId).toBe("allergen.shrimp");
    expect(result.tags![0].source).toBe("master");
    expect(result.tags![0].confirmed).toBe(true);
  });

  it("sets confirmed to false when allergenUnknown is true", () => {
    const ing = {
      id: 7,
      name: "醤油",
      category: "調味料" as const,
      allergens: ["大豆", "小麦"],
      allergenUnknown: true,
    };
    const result = migrateIngredient(ing);
    expect(result.tags).toBeDefined();
    for (const tag of result.tags!) {
      expect(tag.confirmed).toBe(false);
    }
  });

  it("generates empty tags array when allergens is empty", () => {
    const ing = {
      id: 1,
      name: "銀鱈",
      category: "主食材" as const,
      allergens: [],
    };
    const result = migrateIngredient(ing);
    expect(result.tags).toEqual([]);
  });

  it("uses unknown tag id for unrecognized allergen name", () => {
    const ing = {
      id: 99,
      name: "特殊食材",
      category: "主食材" as const,
      allergens: ["存在しないアレルゲン"],
    };
    const result = migrateIngredient(ing);
    expect(result.tags![0].tagId).toBe("unknown.存在しないアレルゲン");
  });
});

describe("migrateCustomer", () => {
  it("returns customer as-is when restrictions already exist", () => {
    const cust = {
      id: 1,
      name: "山田太郎",
      allergens: ["卵"],
      condition: "微量NG",
      contamination: "不可",
      checkInDate: "2026-02-07",
      roomName: "スイート",
      notes: "",
      originalText: "",
      restrictions: [{ tagId: "allergen.egg", source: "self_report" as const }],
      presets: [],
    };
    const result = migrateCustomer(cust);
    expect(result.restrictions).toEqual(cust.restrictions);
  });

  it("generates restrictions from allergens when restrictions is undefined", () => {
    const cust = {
      id: 1,
      name: "山田太郎",
      allergens: ["卵", "えび"],
      condition: "微量NG",
      contamination: "不可",
      checkInDate: "2026-02-07",
      roomName: "スイート",
      notes: "",
      originalText: "",
    };
    const result = migrateCustomer(cust);
    expect(result.restrictions).toBeDefined();
    expect(result.restrictions!.length).toBe(2);
    expect(result.restrictions![0].tagId).toBe("allergen.egg");
    expect(result.restrictions![0].source).toBe("self_report");
    expect(result.restrictions![1].tagId).toBe("allergen.shrimp");
  });

  it("sets presets to empty array when undefined", () => {
    const cust = {
      id: 1,
      name: "テスト",
      allergens: [],
      condition: "",
      contamination: "",
      checkInDate: "",
      roomName: "",
      notes: "",
      originalText: "",
    };
    const result = migrateCustomer(cust);
    expect(result.presets).toEqual([]);
  });
});

describe("migrateRecipe", () => {
  it("returns recipe as-is when ingredientLinks already exist", () => {
    const recipe = {
      id: 1,
      name: "テスト料理",
      version: "v1",
      linkedIngredients: [{ id: 1, name: "食材", category: "主食材" as const, allergens: [] }],
      ingredientLinks: [{ ingredientId: 1, cookingState: "raw" as const }],
    };
    const result = migrateRecipe(recipe);
    expect(result.ingredientLinks).toEqual(recipe.ingredientLinks);
  });

  it("generates ingredientLinks from linkedIngredients with default cooked state", () => {
    const recipe = {
      id: 1,
      name: "テスト料理",
      version: "v1",
      linkedIngredients: [
        { id: 1, name: "銀鱈", category: "主食材" as const, allergens: [] },
        { id: 5, name: "白味噌", category: "調味料" as const, allergens: ["大豆"] },
      ],
    };
    const result = migrateRecipe(recipe);
    expect(result.ingredientLinks).toBeDefined();
    expect(result.ingredientLinks!.length).toBe(2);
    expect(result.ingredientLinks![0]).toEqual({ ingredientId: 1, cookingState: "cooked" });
    expect(result.ingredientLinks![1]).toEqual({ ingredientId: 5, cookingState: "cooked" });
  });
});
