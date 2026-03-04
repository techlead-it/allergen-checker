import { describe, it, expect } from "vitest";
import {
  allTags,
  cookingStateRules,
  pregnancyPreset,
  findTagById,
  getTagsByCategory,
  getChildTags,
} from "./tags";

describe("Tag master data", () => {
  describe("allergen tags (28 items)", () => {
    it("contains exactly 8 mandatory allergen tags", () => {
      const mandatory = getTagsByCategory("allergen_mandatory");
      expect(mandatory).toHaveLength(8);

      const names = mandatory.map((t) => t.name).sort();
      expect(names).toEqual(
        ["えび", "かに", "くるみ", "そば", "卵", "小麦", "乳", "落花生"].sort(),
      );
    });

    it("sets displayPriority to critical for mandatory allergens", () => {
      const mandatory = getTagsByCategory("allergen_mandatory");
      for (const tag of mandatory) {
        expect(tag.displayPriority).toBe("critical");
      }
    });

    it("contains exactly 20 recommended allergen tags", () => {
      const recommended = getTagsByCategory("allergen_recommended");
      expect(recommended).toHaveLength(20);
    });

    it("sets displayPriority to high for recommended allergens", () => {
      const recommended = getTagsByCategory("allergen_recommended");
      for (const tag of recommended) {
        expect(tag.displayPriority).toBe("high");
      }
    });

    it("marks all allergen tags as system defined", () => {
      const mandatory = getTagsByCategory("allergen_mandatory");
      const recommended = getTagsByCategory("allergen_recommended");
      for (const tag of [...mandatory, ...recommended]) {
        expect(tag.isSystemDefined).toBe(true);
      }
    });

    it("assigns unique IDs with allergen. prefix", () => {
      const mandatory = getTagsByCategory("allergen_mandatory");
      const recommended = getTagsByCategory("allergen_recommended");
      const ids = [...mandatory, ...recommended].map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
      for (const id of ids) {
        expect(id).toMatch(/^allergen\./);
      }
    });
  });

  describe("taxonomy tags", () => {
    it("contains taxonomy tags with parentTagId hierarchy", () => {
      const taxonomy = getTagsByCategory("taxonomy");
      expect(taxonomy.length).toBeGreaterThan(0);

      const crustacean = findTagById("tax.crustacean");
      expect(crustacean).toBeDefined();
      expect(crustacean?.category).toBe("taxonomy");

      const shrimp = findTagById("allergen.shrimp");
      expect(shrimp?.parentTagId).toBe("tax.crustacean");

      const crab = findTagById("allergen.crab");
      expect(crab?.parentTagId).toBe("tax.crustacean");
    });

    it("defines oily fish hierarchy", () => {
      const oilyFish = findTagById("tax.oily_fish");
      expect(oilyFish).toBeDefined();

      const mackerel = findTagById("allergen.mackerel");
      expect(mackerel?.parentTagId).toBe("tax.oily_fish");
    });

    it("defines nuts hierarchy", () => {
      const nuts = findTagById("tax.nuts");
      expect(nuts).toBeDefined();

      const peanut = findTagById("allergen.peanut");
      expect(peanut?.parentTagId).toBe("tax.nuts");

      const walnut = findTagById("allergen.walnut");
      expect(walnut?.parentTagId).toBe("tax.nuts");
    });

    it("defines high_mercury_fish taxonomy tag", () => {
      const highMercury = findTagById("tax.high_mercury_fish");
      expect(highMercury).toBeDefined();
      expect(highMercury?.name).toBe("高水銀魚");
      expect(highMercury?.category).toBe("taxonomy");
      expect(highMercury?.displayPriority).toBe("high");
      expect(highMercury?.synonyms).toContain("マグロ");
      expect(highMercury?.synonyms).toContain("メカジキ");
    });

    it("defines animal_product and meat taxonomy for cookingState rules", () => {
      const animalProduct = findTagById("tax.animal_product");
      expect(animalProduct).toBeDefined();
      expect(animalProduct?.category).toBe("taxonomy");

      const meat = findTagById("tax.meat");
      expect(meat).toBeDefined();
      expect(meat?.category).toBe("taxonomy");
    });

    it("returns child tags for parent", () => {
      const crustaceanChildren = getChildTags("tax.crustacean");
      const childIds = crustaceanChildren.map((t) => t.id);
      expect(childIds).toContain("allergen.shrimp");
      expect(childIds).toContain("allergen.crab");
    });
  });

  describe("texture tags", () => {
    it("contains texture tags", () => {
      const textures = getTagsByCategory("texture");
      expect(textures.length).toBeGreaterThan(0);

      const nebaNeba = findTagById("tex.nebaNeba");
      expect(nebaNeba).toBeDefined();
      expect(nebaNeba?.name).toBe("ネバネバ");
      expect(nebaNeba?.displayPriority).toBe("normal");
      expect(nebaNeba?.synonyms).toContain("ねばねば");
    });
  });

  describe("odor tags", () => {
    it("contains odor tags", () => {
      const odors = getTagsByCategory("odor");
      expect(odors.length).toBeGreaterThan(0);

      const strong = findTagById("odor.strong");
      expect(strong).toBeDefined();
      expect(strong?.name).toBe("においが強い");
    });
  });

  describe("risk tags", () => {
    it("contains risk tags with critical priority", () => {
      const risks = getTagsByCategory("risk");
      expect(risks.length).toBeGreaterThanOrEqual(3);

      const listeria = findTagById("risk.listeria");
      expect(listeria).toBeDefined();
      expect(listeria?.displayPriority).toBe("critical");

      const toxoplasma = findTagById("risk.toxoplasma");
      expect(toxoplasma).toBeDefined();
      expect(toxoplasma?.displayPriority).toBe("critical");

      const mercury = findTagById("risk.mercury");
      expect(mercury).toBeDefined();
      expect(mercury?.displayPriority).toBe("critical");
    });
  });

  describe("pregnancy preset", () => {
    it("references existing risk tag IDs", () => {
      for (const presetTagId of pregnancyPreset.tagIds) {
        expect(findTagById(presetTagId)).toBeDefined();
      }
    });

    it("includes listeria, toxoplasma, and mercury risk tags", () => {
      expect(pregnancyPreset.tagIds).toContain("risk.listeria");
      expect(pregnancyPreset.tagIds).toContain("risk.toxoplasma");
      expect(pregnancyPreset.tagIds).toContain("risk.mercury");
    });

    it("is editable by facility", () => {
      expect(pregnancyPreset.isEditable).toBe(true);
    });
  });

  describe("cookingState rules", () => {
    it("defines rules that reference existing tag IDs", () => {
      for (const rule of cookingStateRules) {
        expect(findTagById(rule.derivedTagId)).toBeDefined();
        if (rule.condition.requiresTag) {
          expect(findTagById(rule.condition.requiresTag)).toBeDefined();
        }
      }
    });

    it("derives listeria risk from raw animal products", () => {
      const listeriaRule = cookingStateRules.find((r) => r.derivedTagId === "risk.listeria");
      expect(listeriaRule).toBeDefined();
      expect(listeriaRule?.condition.cookingState).toBe("raw");
      expect(listeriaRule?.condition.requiresTag).toBe("tax.animal_product");
    });

    it("derives toxoplasma risk from semi-raw meat", () => {
      const toxoRule = cookingStateRules.find((r) => r.derivedTagId === "risk.toxoplasma");
      expect(toxoRule).toBeDefined();
      expect(toxoRule?.condition.cookingState).toBe("semi_raw");
      expect(toxoRule?.condition.requiresTag).toBe("tax.meat");
    });

    it("derives mercury risk from high_mercury_fish in all cooking states", () => {
      const mercuryRules = cookingStateRules.filter((r) => r.derivedTagId === "risk.mercury");
      expect(mercuryRules).toHaveLength(3);

      const cookingStates = mercuryRules.map((r) => r.condition.cookingState).sort();
      expect(cookingStates).toEqual(["cooked", "raw", "semi_raw"]);

      for (const rule of mercuryRules) {
        expect(rule.condition.requiresTag).toBe("tax.high_mercury_fish");
      }
    });
  });

  describe("tag ID uniqueness", () => {
    it("has no duplicate tag IDs", () => {
      const ids = allTags.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
