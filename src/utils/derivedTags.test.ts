import { describe, it, expect } from "vitest";
import type { CookingStateRule } from "../data/types";
import { getDerivedTagIds } from "./derivedTags";

const testRules: CookingStateRule[] = [
  {
    condition: { cookingState: "raw", requiresTag: "tax.fish" },
    derivedTagId: "risk.listeria",
    description: "生の魚類はリステリア菌のリスクがあります",
  },
  {
    condition: { cookingState: "semi_raw", requiresTag: "tax.meat" },
    derivedTagId: "risk.toxoplasma",
    description: "半生の肉はトキソプラズマのリスクがあります",
  },
];

describe("getDerivedTagIds", () => {
  it("derives risk.listeria from raw fish", () => {
    const result = getDerivedTagIds("raw", ["tax.fish"], testRules);
    expect(result).toEqual(["risk.listeria"]);
  });

  it("derives nothing from cooked fish", () => {
    const result = getDerivedTagIds("cooked", ["tax.fish"], testRules);
    expect(result).toEqual([]);
  });

  it("derives risk.toxoplasma from semi_raw meat", () => {
    const result = getDerivedTagIds("semi_raw", ["tax.meat"], testRules);
    expect(result).toEqual(["risk.toxoplasma"]);
  });

  it("derives nothing when required tag is missing", () => {
    const result = getDerivedTagIds("raw", ["tex.nebaNeba"], testRules);
    expect(result).toEqual([]);
  });

  it("derives nothing when cookingState does not match", () => {
    const result = getDerivedTagIds("cooked", ["tax.meat"], testRules);
    expect(result).toEqual([]);
  });

  it("derives from rule without requiresTag when cookingState matches", () => {
    const rulesWithoutRequires: CookingStateRule[] = [
      {
        condition: { cookingState: "raw" },
        derivedTagId: "risk.general_raw",
        description: "生食のリスクがあります",
      },
    ];
    const result = getDerivedTagIds("raw", ["anything"], rulesWithoutRequires);
    expect(result).toEqual(["risk.general_raw"]);
  });
});
