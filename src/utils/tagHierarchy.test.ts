import { describe, it, expect } from "vitest";
import type { Tag } from "../data/types";
import { getEffectiveTags } from "./tagHierarchy";

const testTags: Tag[] = [
  {
    id: "tax.crustacean",
    name: "甲殻類",
    category: "taxonomy",
    displayPriority: "high",
    synonyms: [],
    isSystemDefined: true,
  },
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
    id: "allergen.beef",
    name: "牛肉",
    category: "allergen_recommended",
    displayPriority: "high",
    parentTagId: "tax.meat",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "allergen.pork",
    name: "豚肉",
    category: "allergen_recommended",
    displayPriority: "high",
    parentTagId: "tax.meat",
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
];

describe("getEffectiveTags", () => {
  it("returns only itself when tag has no children", () => {
    const result = getEffectiveTags("allergen.egg", testTags);
    expect(result).toEqual(["allergen.egg"]);
  });

  it("returns itself and all direct children for parent tag", () => {
    const result = getEffectiveTags("tax.crustacean", testTags);
    expect(result.sort()).toEqual(["tax.crustacean", "allergen.shrimp", "allergen.crab"].sort());
  });

  it("returns itself and all descendants for deep hierarchy (3 levels)", () => {
    // tax.animal_product → tax.meat → [allergen.beef, allergen.pork]
    const result = getEffectiveTags("tax.animal_product", testTags);
    expect(result.sort()).toEqual(
      ["tax.animal_product", "tax.meat", "allergen.beef", "allergen.pork"].sort(),
    );
  });

  it("returns only itself for leaf tag with no children", () => {
    const result = getEffectiveTags("allergen.shrimp", testTags);
    expect(result).toEqual(["allergen.shrimp"]);
  });

  it("returns only itself for non-existent tag ID without error", () => {
    const result = getEffectiveTags("non.existent", testTags);
    expect(result).toEqual(["non.existent"]);
  });
});
