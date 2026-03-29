import { describe, it, expect } from "vite-plus/test";
import { convertImportedToIngredient } from "./importToIngredient";
import type { ImportedIngredient } from "../data/types";

function makeImported(overrides: Partial<ImportedIngredient> = {}): ImportedIngredient {
  return {
    id: 1,
    sourceFile: "test.pdf",
    name: "テスト食材",
    rawMaterials: [],
    status: "確定",
    ...overrides,
  };
}

describe("convertImportedToIngredient", () => {
  it("converts allergen names to tag attachments", () => {
    const imported = makeImported({
      rawMaterials: [
        { name: "小麦粉", allergens: ["小麦"] },
        { name: "卵白", allergens: ["卵"] },
      ],
    });

    const result = convertImportedToIngredient(imported, new Set());

    expect(result.tags).toHaveLength(2);
    const tagIds = result.tags.map((t) => t.tagId);
    expect(tagIds).toContain("allergen.wheat");
    expect(tagIds).toContain("allergen.egg");
  });

  it("deduplicates allergen tags from multiple raw materials", () => {
    const imported = makeImported({
      rawMaterials: [
        { name: "醤油", allergens: ["大豆"] },
        { name: "味噌", allergens: ["大豆"] },
      ],
    });

    const result = convertImportedToIngredient(imported, new Set());

    const soyTags = result.tags.filter((t) => t.tagId === "allergen.soybean");
    expect(soyTags).toHaveLength(1);
  });

  it("preserves non-allergen tags from imported ingredient", () => {
    const imported = makeImported({
      rawMaterials: [],
      tags: [{ tagId: "tex.nebaNeba", source: "manual", confirmed: true }],
    });

    const result = convertImportedToIngredient(imported, new Set());

    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].tagId).toBe("tex.nebaNeba");
    expect(result.tags[0].confirmed).toBe(true);
  });

  it("sets category to 主食材", () => {
    const imported = makeImported();
    const result = convertImportedToIngredient(imported, new Set());
    expect(result.category).toBe("主食材");
  });

  it("generates ID as imported.id + 1000 when no collision", () => {
    const imported = makeImported({ id: 5 });
    const result = convertImportedToIngredient(imported, new Set());
    expect(result.id).toBe(1005);
  });

  it("increments ID to avoid collision with existing IDs", () => {
    const imported = makeImported({ id: 5 });
    const existingIds = new Set([1005, 1006]);
    const result = convertImportedToIngredient(imported, existingIds);
    expect(result.id).toBe(1007);
  });

  it("sets source to master and confirmed to true for allergen tags", () => {
    const imported = makeImported({
      rawMaterials: [{ name: "えび", allergens: ["えび"] }],
    });

    const result = convertImportedToIngredient(imported, new Set());

    expect(result.tags[0].source).toBe("master");
    expect(result.tags[0].confirmed).toBe(true);
  });

  it("preserves ingredient name from imported", () => {
    const imported = makeImported({ name: "特製バター" });
    const result = convertImportedToIngredient(imported, new Set());
    expect(result.name).toBe("特製バター");
  });
});
