import { describe, it, expect } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { TagChip } from "./TagChip";
import type { Tag, TagAttachment } from "../data/types";

function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: "allergen.shrimp",
    name: "えび",
    category: "allergen_mandatory",
    displayPriority: "critical",
    synonyms: [],
    isSystemDefined: true,
    ...overrides,
  };
}

function makeAttachment(overrides: Partial<TagAttachment> = {}): TagAttachment {
  return {
    tagId: "allergen.shrimp",
    source: "master",
    confirmed: true,
    ...overrides,
  };
}

describe("TagChip", () => {
  it("renders tag name", () => {
    render(<TagChip tag={makeTag()} attachment={makeAttachment()} />);
    expect(screen.getByText("えび")).toBeInTheDocument();
  });

  it("applies red style for critical priority tags", () => {
    render(
      <TagChip tag={makeTag({ displayPriority: "critical" })} attachment={makeAttachment()} />,
    );
    const chip = screen.getByText("えび").closest("[data-priority]");
    expect(chip).toHaveAttribute("data-priority", "critical");
  });

  it("applies yellow style for high priority tags", () => {
    render(
      <TagChip
        tag={makeTag({ displayPriority: "high", name: "大豆", id: "allergen.soy" })}
        attachment={makeAttachment({ tagId: "allergen.soy" })}
      />,
    );
    const chip = screen.getByText("大豆").closest("[data-priority]");
    expect(chip).toHaveAttribute("data-priority", "high");
  });

  it("applies blue style for normal priority tags", () => {
    render(
      <TagChip
        tag={makeTag({ displayPriority: "normal", name: "ネバネバ", id: "texture.sticky" })}
        attachment={makeAttachment({ tagId: "texture.sticky" })}
      />,
    );
    const chip = screen.getByText("ネバネバ").closest("[data-priority]");
    expect(chip).toHaveAttribute("data-priority", "normal");
  });

  it("shows unconfirmed indicator for unconfirmed tags", () => {
    render(<TagChip tag={makeTag()} attachment={makeAttachment({ confirmed: false })} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("does not show unconfirmed indicator for confirmed tags", () => {
    render(<TagChip tag={makeTag()} attachment={makeAttachment({ confirmed: true })} />);
    expect(screen.queryByText("?")).not.toBeInTheDocument();
  });

  it("shows matched state when matched prop is true", () => {
    render(<TagChip tag={makeTag()} attachment={makeAttachment()} matched />);
    const chip = screen.getByText("えび").closest("[data-matched]");
    expect(chip).toHaveAttribute("data-matched", "true");
  });
});
