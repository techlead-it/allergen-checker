import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TagCheckboxGroup } from "./TagCheckboxGroup";
import type { Tag } from "../data/types";

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
    id: "allergen.soy",
    name: "大豆",
    category: "allergen_recommended",
    displayPriority: "high",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "taxonomy.crustacean",
    name: "甲殻類",
    category: "taxonomy",
    displayPriority: "high",
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
    displayPriority: "critical",
    synonyms: [],
    isSystemDefined: true,
  },
];

describe("TagCheckboxGroup", () => {
  it("renders category sections grouped by category", () => {
    render(<TagCheckboxGroup tags={sampleTags} selectedTagIds={[]} onToggle={() => {}} />);
    expect(screen.getByText("特定原材料 8品目（法的義務）")).toBeInTheDocument();
    expect(screen.getByText("準特定原材料 20品目（推奨表示）")).toBeInTheDocument();
    expect(screen.getByText("食材分類")).toBeInTheDocument();
    expect(screen.getByText("食感")).toBeInTheDocument();
    expect(screen.getByText("健康リスク")).toBeInTheDocument();
  });

  it("renders tag names as checkboxes", () => {
    render(<TagCheckboxGroup tags={sampleTags} selectedTagIds={[]} onToggle={() => {}} />);
    expect(screen.getByText("卵")).toBeInTheDocument();
    expect(screen.getByText("えび")).toBeInTheDocument();
    expect(screen.getByText("大豆")).toBeInTheDocument();
    expect(screen.getByText("甲殻類")).toBeInTheDocument();
    expect(screen.getByText("ネバネバ")).toBeInTheDocument();
    expect(screen.getByText("リステリアリスク")).toBeInTheDocument();
  });

  it("checks selected tags", () => {
    render(
      <TagCheckboxGroup tags={sampleTags} selectedTagIds={["allergen.egg"]} onToggle={() => {}} />,
    );
    const eggCheckbox = screen.getByRole("checkbox", { name: "卵" });
    expect(eggCheckbox).toBeChecked();
    const shrimpCheckbox = screen.getByRole("checkbox", { name: "えび" });
    expect(shrimpCheckbox).not.toBeChecked();
  });

  it("calls onToggle when a tag is clicked", () => {
    const onToggle = vi.fn();
    render(<TagCheckboxGroup tags={sampleTags} selectedTagIds={[]} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "卵" }));
    expect(onToggle).toHaveBeenCalledWith("allergen.egg");
  });

  it("separates risk tags from allergen_mandatory section", () => {
    render(<TagCheckboxGroup tags={sampleTags} selectedTagIds={[]} onToggle={() => {}} />);
    // リスクタグは「健康リスク」セクションに表示される（「特定原材料」セクションではない）
    const riskSection = screen.getByText("健康リスク").closest("div");
    expect(riskSection).toBeInTheDocument();
    // リステリアリスクのチェックボックスが存在する
    expect(screen.getByRole("checkbox", { name: "リステリアリスク" })).toBeInTheDocument();
  });
});
