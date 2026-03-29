import { describe, it, expect } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { TagSummary } from "./TagSummary";
import type { Tag, CustomerRestriction } from "../data/types";

const sampleTags: Tag[] = [
  {
    id: "allergen.egg",
    name: "卵",
    category: "allergen_mandatory",
    displayPriority: "critical",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "allergen.shrimp",
    name: "えび",
    category: "allergen_mandatory",
    displayPriority: "critical",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "texture.sticky",
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
    displayPriority: "normal",
    synonyms: [],
    isSystemDefined: true,
  },
];

describe("TagSummary", () => {
  it("renders selected tag names with source labels", () => {
    const restrictions: CustomerRestriction[] = [
      { tagId: "allergen.egg", source: "self_report" },
      { tagId: "texture.sticky", source: "self_report" },
    ];
    render(<TagSummary restrictions={restrictions} allTags={sampleTags} />);
    expect(screen.getByText(/卵/)).toBeInTheDocument();
    expect(screen.getByText(/ネバネバ/)).toBeInTheDocument();
  });

  it("shows source label for preset restrictions", () => {
    const restrictions: CustomerRestriction[] = [{ tagId: "risk.listeria", source: "preset" }];
    render(<TagSummary restrictions={restrictions} allTags={sampleTags} />);
    expect(screen.getByText(/リステリアリスク/)).toBeInTheDocument();
    expect(screen.getByText(/プリセット/)).toBeInTheDocument();
  });

  it("shows source label for self_report restrictions", () => {
    const restrictions: CustomerRestriction[] = [{ tagId: "allergen.egg", source: "self_report" }];
    render(<TagSummary restrictions={restrictions} allTags={sampleTags} />);
    expect(screen.getByText(/自己申告/)).toBeInTheDocument();
  });

  it("renders nothing when no restrictions", () => {
    const { container } = render(<TagSummary restrictions={[]} allTags={sampleTags} />);
    expect(container.textContent).toBe("");
  });
});
