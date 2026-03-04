import { useMemo } from "react";
import { getAllTagsWithCustom } from "../data/tags";
import { useCustomTags } from "../hooks/useCustomTags";
import type { TagCategory } from "../data/types";

const propertyTagCategories: { category: TagCategory; label: string }[] = [
  { category: "taxonomy", label: "食材分類" },
  { category: "texture", label: "食感" },
  { category: "odor", label: "匂い" },
  { category: "risk", label: "リスク" },
];

type Props = {
  selectedTagIds: Set<string>;
  onToggle: (tagId: string) => void;
};

export function PropertyTagsEditor({ selectedTagIds, onToggle }: Props) {
  const { items: customItems } = useCustomTags();
  const allTagsWithCustom = useMemo(() => getAllTagsWithCustom(customItems), [customItems]);

  return (
    <div className="space-y-3 p-4 bg-bg-cream/30 rounded-lg border border-border-light">
      <h4 className="text-xs font-semibold text-text-muted uppercase">食材特性タグ</h4>
      {propertyTagCategories.map(({ category, label }) => {
        const tags = allTagsWithCustom.filter((t) => t.category === category);
        if (tags.length === 0) return null;
        return (
          <div key={category} className="space-y-1">
            <p className="text-[11px] text-text-muted font-medium">{label}</p>
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onToggle(t.id)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-pointer transition-colors ${
                    selectedTagIds.has(t.id)
                      ? "bg-primary text-white border-primary"
                      : "bg-bg-cream text-text-muted border-border-light hover:border-primary/30"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
