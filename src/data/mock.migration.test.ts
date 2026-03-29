import { describe, it, expect } from "vite-plus/test";
import { availableIngredients, recipes, customers } from "./mock";
import { findTagByName, allTags } from "./tags";

describe("mock data migration: ingredients", () => {
  it("all ingredients have tags field", () => {
    for (const ing of availableIngredients) {
      expect(ing.tags).toBeDefined();
      expect(Array.isArray(ing.tags)).toBe(true);
    }
  });

  it("ingredients with tags have valid tag IDs that exist in allTags", () => {
    for (const ing of availableIngredients) {
      for (const t of ing.tags) {
        const tag = findTagByName(t.tagId) ?? allTags.find((at) => at.id === t.tagId);
        expect(tag).toBeDefined();
      }
    }
  });

  it("unconfirmed tags are present for ingredients like 醤油", () => {
    const soySource = availableIngredients.find((i) => i.name === "醤油");
    expect(soySource).toBeDefined();
    const allergenTags = soySource!.tags.filter((t) => t.tagId.startsWith("allergen."));
    expect(allergenTags.length).toBeGreaterThan(0);
    for (const tag of allergenTags) {
      expect(tag.confirmed).toBe(false);
    }
  });

  it("confirmed tags are present for ingredients like 車えび", () => {
    const shrimp = availableIngredients.find((i) => i.name === "車えび");
    expect(shrimp).toBeDefined();
    const allergenTags = shrimp!.tags.filter((t) => t.tagId.startsWith("allergen."));
    expect(allergenTags.length).toBeGreaterThan(0);
    for (const tag of allergenTags) {
      expect(tag.confirmed).toBe(true);
    }
  });
});

describe("mock data migration: customers", () => {
  it("all customers have restrictions field", () => {
    for (const cust of customers) {
      expect(cust.restrictions).toBeDefined();
      expect(Array.isArray(cust.restrictions)).toBe(true);
    }
  });

  it("all customer restrictions have valid tag IDs", () => {
    for (const cust of customers) {
      for (const r of cust.restrictions) {
        const tag = allTags.find((t) => t.id === r.tagId);
        expect(tag).toBeDefined();
      }
    }
  });

  it("all customer restrictions have valid source", () => {
    const validSources = ["self_report", "medical", "preset"];
    for (const cust of customers) {
      for (const restriction of cust.restrictions ?? []) {
        expect(validSources).toContain(restriction.source);
      }
    }
  });
});

describe("mock data migration: recipes", () => {
  it("all recipes have ingredientLinks field", () => {
    for (const recipe of recipes) {
      expect(recipe.ingredientLinks).toBeDefined();
      expect(Array.isArray(recipe.ingredientLinks)).toBe(true);
    }
  });

  it("ingredientLinks match linkedIngredients by id", () => {
    for (const recipe of recipes) {
      const linkedIds = recipe.linkedIngredients.map((i) => i.id);
      const linkIds = (recipe.ingredientLinks ?? []).map((l) => l.ingredientId);
      expect(linkIds.sort()).toEqual(linkedIds.sort());
    }
  });

  it("all ingredientLinks have a valid cookingState", () => {
    const validStates = ["raw", "cooked", "semi_raw"];
    for (const recipe of recipes) {
      for (const link of recipe.ingredientLinks ?? []) {
        expect(validStates).toContain(link.cookingState);
      }
    }
  });
});

describe("findTagByName helper", () => {
  it("finds allergen tag by Japanese name", () => {
    expect(findTagByName("えび")).toEqual(expect.objectContaining({ id: "allergen.shrimp" }));
  });

  it("finds tag by synonym", () => {
    expect(findTagByName("エビ")).toEqual(expect.objectContaining({ id: "allergen.shrimp" }));
  });

  it("returns undefined for unknown name", () => {
    expect(findTagByName("存在しない食材")).toBeUndefined();
  });
});
