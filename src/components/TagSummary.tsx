import type { Tag, CustomerRestriction } from "../data/types";

const sourceLabels: Record<CustomerRestriction["source"], string> = {
  self_report: "自己申告",
  medical: "医師指示",
  preset: "プリセット",
};

export function TagSummary({
  restrictions,
  allTags,
}: {
  restrictions: CustomerRestriction[];
  allTags: Tag[];
}) {
  if (restrictions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {restrictions.map((r) => {
        const tag = allTags.find((t) => t.id === r.tagId);
        const name = tag?.name ?? r.tagId;
        const sourceLabel = sourceLabels[r.source];
        return (
          <span
            key={r.tagId}
            className="px-2 py-0.5 bg-bg-cream border border-border rounded text-xs text-text-secondary"
          >
            {name}
            <span className="text-text-muted ml-1">({sourceLabel})</span>
          </span>
        );
      })}
    </div>
  );
}
