import { useState, useMemo } from "react";
import type { ImportedIngredient, RawMaterial } from "../data/mock";
import { Modal } from "./Modal";
import { StatusBadge } from "./StatusBadge";
import { TagChip } from "./TagChip";
import { findTagByName, getTagsByCategory, getAllTagsWithCustom } from "../data/tags";
import { useCustomTags } from "../hooks/useCustomTags";
import type { Tag, TagAttachment, TagCategory } from "../data/types";

const allergenTags = [
  ...getTagsByCategory("allergen_mandatory"),
  ...getTagsByCategory("allergen_recommended"),
];

/** 食材特性タグのカテゴリ（非アレルゲン） */
const propertyTagCategories: { category: TagCategory; label: string }[] = [
  { category: "taxonomy", label: "食材分類" },
  { category: "texture", label: "食感" },
  { category: "odor", label: "匂い" },
  { category: "risk", label: "リスク" },
];

type Props = {
  item: ImportedIngredient | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (updated: ImportedIngredient) => void;
};

function collectAllergenTags(materials: RawMaterial[]): { tag: Tag; attachment: TagAttachment }[] {
  const names = [...new Set(materials.flatMap((m) => m.allergens))];
  const result: { tag: Tag; attachment: TagAttachment }[] = [];
  for (const name of names) {
    const tag = findTagByName(name);
    if (tag) {
      result.push({
        tag,
        attachment: { tagId: tag.id, source: "master", confirmed: true },
      });
    }
  }
  return result;
}

export function IngredientDetailModal({ item, open, onClose, onUpdate }: Props) {
  const { items: customItems } = useCustomTags();
  const allTagsWithCustom = useMemo(() => getAllTagsWithCustom(customItems), [customItems]);

  const [editing, setEditing] = useState(false);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [editingTags, setEditingTags] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState("");
  const [newAllergens, setNewAllergens] = useState<string[]>([]);

  function startEdit() {
    if (!item) return;
    setMaterials(item.rawMaterials.map((m) => ({ ...m, allergens: [...m.allergens] })));
    setEditingTags(new Set((item.tags ?? []).map((t) => t.tagId)));
    setEditing(true);
    setNewName("");
    setNewAllergens([]);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function saveEdit() {
    if (!item) return;
    const tags: TagAttachment[] = [...editingTags].map((tagId) => ({
      tagId,
      source: "manual" as const,
      confirmed: true,
    }));
    onUpdate({ ...item, rawMaterials: materials, tags });
    setEditing(false);
  }

  function togglePropertyTag(tagId: string) {
    setEditingTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  function removeMaterial(idx: number) {
    setMaterials((prev) => prev.filter((_, i) => i !== idx));
  }

  function toggleMaterialAllergen(idx: number, allergen: string) {
    setMaterials((prev) =>
      prev.map((m, i) => {
        if (i !== idx) return m;
        const has = m.allergens.includes(allergen);
        return {
          ...m,
          allergens: has ? m.allergens.filter((a) => a !== allergen) : [...m.allergens, allergen],
        };
      }),
    );
  }

  function addMaterial() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setMaterials((prev) => [...prev, { name: trimmed, allergens: [...newAllergens] }]);
    setNewName("");
    setNewAllergens([]);
  }

  function toggleNewAllergen(allergen: string) {
    setNewAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen],
    );
  }

  if (!item) return null;

  const displayMaterials = editing ? materials : item.rawMaterials;
  const allergenChips = collectAllergenTags(displayMaterials);

  return (
    <Modal open={open} onClose={onClose} title="食材詳細">
      <div className="space-y-5">
        {/* Header info */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6 text-sm text-text-secondary">
          <span>
            食材名: <strong className="text-text">{item.name}</strong>
          </span>
          <span className="text-border hidden sm:inline">|</span>
          <span>
            出典: <strong className="text-text">{item.sourceFile}</strong>
          </span>
          <span className="text-border hidden sm:inline">|</span>
          <StatusBadge value={item.status} />
        </div>

        {/* Allergen summary */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-text-muted">検出アレルゲン:</span>
          {allergenChips.length === 0 ? (
            <span className="text-xs text-text-muted">—</span>
          ) : (
            allergenChips.map(({ tag, attachment }) => (
              <TagChip key={tag.id} tag={tag} attachment={attachment} />
            ))
          )}
        </div>

        {/* 食材特性タグ（表示モード） */}
        {!editing && (item?.tags ?? []).length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-text-muted">食材特性:</span>
            {(item?.tags ?? []).map((att) => {
              const tag = allTagsWithCustom.find((t) => t.id === att.tagId);
              if (!tag) return null;
              return <TagChip key={tag.id} tag={tag} attachment={att} />;
            })}
          </div>
        )}

        {/* 食材特性タグ（編集モード） */}
        {editing && (
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
                        onClick={() => togglePropertyTag(t.id)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-pointer transition-colors ${
                          editingTags.has(t.id)
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
        )}

        {/* Raw materials table */}
        <div className="bg-bg-cream/50 rounded-lg border border-border-light overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-cream/60">
                <th className="py-2 px-3 text-left text-[11px] font-semibold text-text-muted uppercase">
                  原材料名
                </th>
                <th className="py-2 px-3 text-left text-[11px] font-semibold text-text-muted uppercase">
                  含有アレルゲン
                </th>
                {editing && (
                  <th className="py-2 px-3 text-center text-[11px] font-semibold text-text-muted uppercase w-16">
                    削除
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayMaterials.map((mat, idx) => (
                <tr
                  key={`${mat.name}-${idx}`}
                  className="border-b border-border-light last:border-0"
                >
                  <td className="py-2 px-3 font-medium">{mat.name}</td>
                  <td className="py-2 px-3">
                    {editing ? (
                      <div className="flex flex-wrap gap-1">
                        {allergenTags.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleMaterialAllergen(idx, t.name)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-pointer transition-colors ${
                              mat.allergens.includes(t.name)
                                ? "bg-primary text-white border-primary"
                                : "bg-bg-cream text-text-muted border-border-light hover:border-primary/30"
                            }`}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {mat.allergens.length === 0 ? (
                          <span className="text-xs text-text-muted">—</span>
                        ) : (
                          mat.allergens.map((name) => {
                            const tag = findTagByName(name);
                            if (!tag)
                              return (
                                <span
                                  key={name}
                                  className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-bg-cream text-text-secondary border-border"
                                >
                                  {name}
                                </span>
                              );
                            return (
                              <TagChip
                                key={tag.id}
                                tag={tag}
                                attachment={{ tagId: tag.id, source: "master", confirmed: true }}
                              />
                            );
                          })
                        )}
                      </div>
                    )}
                  </td>
                  {editing && (
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeMaterial(idx)}
                        className="text-xs text-ng hover:text-ng/80 font-medium cursor-pointer"
                      >
                        削除
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {displayMaterials.length === 0 && (
                <tr>
                  <td
                    colSpan={editing ? 3 : 2}
                    className="py-4 text-center text-sm text-text-muted"
                  >
                    原材料が登録されていません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add new material (edit mode) */}
        {editing && (
          <div className="space-y-3 p-4 bg-bg-cream/30 rounded-lg border border-border-light">
            <h4 className="text-xs font-semibold text-text-muted uppercase">原材料を追加</h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="原材料名"
                className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-bg-card focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={addMaterial}
                disabled={!newName.trim()}
                className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                追加
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {allergenTags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleNewAllergen(t.name)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-pointer transition-colors ${
                    newAllergens.includes(t.name)
                      ? "bg-primary text-white border-primary"
                      : "bg-bg-cream text-text-muted border-border-light hover:border-primary/30"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-cream transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors cursor-pointer"
              >
                保存
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startEdit}
              className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-cream transition-colors cursor-pointer"
            >
              編集
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
