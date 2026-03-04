import { describe, it, expect } from "vitest";
import type {
  Tag,
  TagCategory,
  DisplayPriority,
  TagAttachment,
  CustomerRestriction,
  CookingState,
  CookingStateRule,
  RestrictionPreset,
} from "./types";

describe("Tag type definitions", () => {
  it("creates a valid Tag with all required fields", () => {
    const tag: Tag = {
      id: "allergen.egg",
      name: "卵",
      category: "allergen_mandatory",
      displayPriority: "critical",
      synonyms: ["たまご", "鶏卵"],
      isSystemDefined: true,
    };

    expect(tag.id).toBe("allergen.egg");
    expect(tag.name).toBe("卵");
    expect(tag.category).toBe("allergen_mandatory");
    expect(tag.displayPriority).toBe("critical");
    expect(tag.synonyms).toEqual(["たまご", "鶏卵"]);
    expect(tag.isSystemDefined).toBe(true);
  });

  it("creates a Tag with parentTagId for hierarchy", () => {
    const tag: Tag = {
      id: "allergen.shrimp",
      name: "えび",
      category: "allergen_mandatory",
      displayPriority: "critical",
      parentTagId: "tax.crustacean",
      synonyms: [],
      isSystemDefined: true,
    };

    expect(tag.parentTagId).toBe("tax.crustacean");
  });

  it("creates a valid TagAttachment", () => {
    const attachment: TagAttachment = {
      tagId: "allergen.egg",
      source: "ai",
      confirmed: false,
      evidence: "OCR結果 p.2",
    };

    expect(attachment.tagId).toBe("allergen.egg");
    expect(attachment.source).toBe("ai");
    expect(attachment.confirmed).toBe(false);
    expect(attachment.evidence).toBe("OCR結果 p.2");
  });

  it("creates a valid CustomerRestriction", () => {
    const restriction: CustomerRestriction = {
      tagId: "allergen.egg",
      source: "self_report",
      note: "微量でもNG",
    };

    expect(restriction.tagId).toBe("allergen.egg");
    expect(restriction.source).toBe("self_report");
    expect(restriction.note).toBe("微量でもNG");
  });

  it("creates a valid CookingStateRule", () => {
    const rule: CookingStateRule = {
      condition: {
        cookingState: "raw",
        requiresTag: "tax.animal_product",
      },
      derivedTagId: "risk.listeria",
    };

    expect(rule.condition.cookingState).toBe("raw");
    expect(rule.condition.requiresTag).toBe("tax.animal_product");
    expect(rule.derivedTagId).toBe("risk.listeria");
  });

  it("creates a valid RestrictionPreset", () => {
    const preset: RestrictionPreset = {
      id: "pregnancy",
      name: "妊婦",
      tagIds: ["risk.listeria", "risk.toxoplasma", "risk.mercury"],
      isEditable: true,
    };

    expect(preset.id).toBe("pregnancy");
    expect(preset.name).toBe("妊婦");
    expect(preset.tagIds).toHaveLength(3);
    expect(preset.isEditable).toBe(true);
  });

  it("validates all TagCategory values", () => {
    const categories: TagCategory[] = [
      "allergen_mandatory",
      "allergen_recommended",
      "allergen_custom",
      "taxonomy",
      "texture",
      "odor",
      "risk",
    ];

    expect(categories).toHaveLength(7);
  });

  it("validates all DisplayPriority values", () => {
    const priorities: DisplayPriority[] = ["critical", "high", "normal"];

    expect(priorities).toHaveLength(3);
  });

  it("validates all CookingState values", () => {
    const states: CookingState[] = ["raw", "cooked", "semi_raw"];

    expect(states).toHaveLength(3);
  });
});
