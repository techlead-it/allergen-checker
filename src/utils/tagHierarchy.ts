import type { Tag } from "../data/types";

/**
 * 指定タグIDとそのすべての子孫タグIDを返す。
 * 顧客が親タグをNG指定した場合、子タグを持つ食材もすべてNG判定するために使用。
 */
export function getEffectiveTags(tagId: string, allTags: Tag[]): string[] {
  const result = [tagId];
  const children = allTags.filter((t) => t.parentTagId === tagId);
  for (const child of children) {
    result.push(...getEffectiveTags(child.id, allTags));
  }
  return result;
}
