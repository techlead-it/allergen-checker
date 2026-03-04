import type { ImportedIngredient, Ingredient, TagAttachment } from "../data/types";
import { findTagByName } from "../data/tags";

/**
 * ImportedIngredient を Ingredient に変換する。
 * 原材料のアレルゲン名からタグを解決し、食材に直接付与されたタグもマージする。
 */
export function convertImportedToIngredient(
  imported: ImportedIngredient,
  existingIds: Set<number>,
): Ingredient {
  // タグ生成: 原材料のアレルゲンから
  const seenTagIds = new Set<string>();
  const tags: TagAttachment[] = [];

  const allergenNames = [...new Set(imported.rawMaterials.flatMap((m) => m.allergens))];
  for (const name of allergenNames) {
    const tag = findTagByName(name);
    if (tag && !seenTagIds.has(tag.id)) {
      seenTagIds.add(tag.id);
      tags.push({ tagId: tag.id, source: "master", confirmed: true });
    }
  }

  // 食材に直接付与されたタグもマージ
  if (imported.tags) {
    for (const att of imported.tags) {
      if (!seenTagIds.has(att.tagId)) {
        seenTagIds.add(att.tagId);
        tags.push({ ...att, confirmed: true });
      }
    }
  }

  // ID生成: imported.id + 1000 をベースに衝突回避
  let candidateId = imported.id + 1000;
  while (existingIds.has(candidateId)) {
    candidateId++;
  }

  return {
    id: candidateId,
    name: imported.name,
    category: "主食材",
    tags,
  };
}
