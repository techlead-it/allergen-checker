import type { Tag, TagCategory } from "../data/types";

type CategorySection = {
  label: string;
  tags: Tag[];
  colorClass: string;
  activeColorClass: string;
};

const categorySectionConfig: {
  category: TagCategory;
  label: string;
  colorClass: string;
  activeColorClass: string;
}[] = [
  {
    category: "allergen_mandatory",
    label: "特定原材料 8品目（法的義務）",
    colorClass: "bg-bg-cream border-border text-text-secondary hover:border-ng/30",
    activeColorClass: "bg-ng-bg text-ng border-ng-border",
  },
  {
    category: "allergen_recommended",
    label: "準特定原材料 20品目（推奨表示）",
    colorClass: "bg-bg-cream border-border text-text-secondary hover:border-caution/30",
    activeColorClass: "bg-caution-bg text-caution border-caution-border",
  },
  {
    category: "allergen_custom",
    label: "カスタムアレルゲン",
    colorClass: "bg-bg-cream border-border text-text-secondary hover:border-caution/30",
    activeColorClass: "bg-caution-bg text-caution border-caution-border",
  },
  {
    category: "taxonomy",
    label: "食材分類",
    colorClass: "bg-bg-cream border-border text-text-secondary hover:border-primary/30",
    activeColorClass: "bg-primary/10 text-primary border-primary/30",
  },
  {
    category: "texture",
    label: "食感",
    colorClass: "bg-bg-cream border-border text-text-secondary hover:border-primary/30",
    activeColorClass: "bg-primary/10 text-primary border-primary/30",
  },
  {
    category: "odor",
    label: "匂い",
    colorClass: "bg-bg-cream border-border text-text-secondary hover:border-primary/30",
    activeColorClass: "bg-primary/10 text-primary border-primary/30",
  },
  {
    category: "risk",
    label: "健康リスク",
    colorClass: "bg-bg-cream border-border text-text-secondary hover:border-ng/30",
    activeColorClass: "bg-ng-bg text-ng border-ng-border",
  },
];

function groupTagsByCategory(tags: Tag[]): CategorySection[] {
  const sections: CategorySection[] = [];
  for (const config of categorySectionConfig) {
    const categoryTags = tags.filter((t) => t.category === config.category);
    if (categoryTags.length > 0) {
      sections.push({
        label: config.label,
        tags: categoryTags,
        colorClass: config.colorClass,
        activeColorClass: config.activeColorClass,
      });
    }
  }
  return sections;
}

export function TagCheckboxGroup({
  tags,
  selectedTagIds,
  onToggle,
}: {
  tags: Tag[];
  selectedTagIds: string[];
  onToggle: (tagId: string) => void;
}) {
  const sections = groupTagsByCategory(tags);

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.label}>
          <h4 className="text-sm font-semibold text-text mb-2">{section.label}</h4>
          <div className="flex flex-wrap gap-2">
            {section.tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <label
                  key={tag.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer border transition-colors ${
                    isSelected ? section.activeColorClass : section.colorClass
                  }`}
                >
                  <input
                    type="checkbox"
                    aria-label={tag.name}
                    checked={isSelected}
                    onChange={() => onToggle(tag.id)}
                    className="sr-only"
                  />
                  {tag.name}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
