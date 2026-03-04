import type { Tag, TagAttachment } from "../data/types";

const priorityStyles = {
  critical: "bg-ng-bg text-ng border-ng-border",
  high: "bg-caution-bg text-caution border-caution-border",
  normal: "bg-primary/10 text-primary border-primary/30",
} as const;

const matchedStyle = "bg-ng-bg text-ng border-ng-border ring-1 ring-ng/30";

export function TagChip({
  tag,
  attachment,
  matched = false,
}: {
  tag: Tag;
  attachment: TagAttachment;
  matched?: boolean;
}) {
  const baseStyle = matched ? matchedStyle : priorityStyles[tag.displayPriority];
  const unconfirmedStyle = !attachment.confirmed ? "border-dashed" : "";

  return (
    <span
      data-priority={tag.displayPriority}
      data-matched={matched ? "true" : undefined}
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 border rounded text-[11px] font-semibold ${baseStyle} ${unconfirmedStyle}`}
    >
      {tag.name}
      {!attachment.confirmed && <span className="text-[9px] opacity-70">?</span>}
    </span>
  );
}
