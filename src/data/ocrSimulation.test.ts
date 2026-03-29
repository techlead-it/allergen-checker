import { describe, it, expect } from "vite-plus/test";
import { generateRandomIngredients } from "./ocrSimulation";

describe("generateRandomIngredients", () => {
  it("returns requested number of ingredients when count is within pool size", () => {
    const result = generateRandomIngredients("test.pdf", 3);
    expect(result).toHaveLength(3);
  });

  it("returns 1 ingredient when count is 1", () => {
    const result = generateRandomIngredients("test.csv", 1);
    expect(result).toHaveLength(1);
  });

  it("sets sourceFile on all generated ingredients", () => {
    const fileName = "spec_sheet.pdf";
    const result = generateRandomIngredients(fileName, 2);
    for (const item of result) {
      expect(item.sourceFile).toBe(fileName);
    }
  });

  it("sets status to 要確認 on all generated ingredients", () => {
    const result = generateRandomIngredients("test.pdf", 3);
    for (const item of result) {
      expect(item.status).toBe("要確認");
    }
  });

  it("generates unique IDs for all ingredients", () => {
    const result = generateRandomIngredients("test.pdf", 5);
    const ids = result.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("generates tags from rawMaterials allergens", () => {
    // Generate many to increase chance of hitting an ingredient with allergens
    const result = generateRandomIngredients("test.pdf", 10);
    const withAllergens = result.filter((i) => i.rawMaterials.some((m) => m.allergens.length > 0));
    // At least some should have tags
    const withTags = withAllergens.filter((i) => i.tags && i.tags.length > 0);
    expect(withTags.length).toBeGreaterThan(0);
  });

  it("caps result at pool size when count exceeds pool", () => {
    const result = generateRandomIngredients("test.pdf", 100);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result.length).toBeGreaterThan(0);
  });
});
