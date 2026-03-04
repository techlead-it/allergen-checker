import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getAllTagsWithCustom } from "../data/tags";
import { useCustomTags } from "../hooks/useCustomTags";
import { PropertyTagsEditor } from "./PropertyTagsEditor";
import type { Ingredient, IngredientCategory, TagAttachment } from "../data/types";

const categories: { value: IngredientCategory; label: string }[] = [
  { value: "主食材", label: "主食材" },
  { value: "調味料", label: "調味料" },
  { value: "共通仕込み", label: "共通仕込み" },
];

type Props = {
  open: boolean;
  ingredient: Ingredient | null;
  existingNames: string[];
  onSave: (id: number, updates: Partial<Omit<Ingredient, "id">>) => void;
  onClose: () => void;
};

export function IngredientEditModal({ open, ingredient, existingNames, onSave, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<IngredientCategory>("主食材");
  const [allergenTagIds, setAllergenTagIds] = useState<Set<string>>(new Set());
  const [propertyTagIds, setPropertyTagIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const { items: customItems } = useCustomTags();
  const allTagsWithCustom = useMemo(() => getAllTagsWithCustom(customItems), [customItems]);
  const allergenTags = useMemo(
    () =>
      allTagsWithCustom.filter(
        (t) =>
          t.category === "allergen_mandatory" ||
          t.category === "allergen_recommended" ||
          t.category === "allergen_custom",
      ),
    [allTagsWithCustom],
  );

  useEffect(() => {
    if (!open || !ingredient) return;
    setName(ingredient.name);
    setCategory(ingredient.category);
    const aIds = new Set<string>();
    const pIds = new Set<string>();
    for (const att of ingredient.tags) {
      const tag = allTagsWithCustom.find((t) => t.id === att.tagId);
      if (!tag) continue;
      if (
        tag.category === "allergen_mandatory" ||
        tag.category === "allergen_recommended" ||
        tag.category === "allergen_custom"
      ) {
        aIds.add(att.tagId);
      } else {
        pIds.add(att.tagId);
      }
    }
    setAllergenTagIds(aIds);
    setPropertyTagIds(pIds);
    setError("");
  }, [open, ingredient, allTagsWithCustom]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !ingredient) return null;

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("食材名を入力してください");
      return;
    }
    if (trimmed !== ingredient!.name && existingNames.some((n) => n === trimmed)) {
      setError("同名の食材が既に存在します");
      return;
    }

    const tags: TagAttachment[] = [
      ...[...allergenTagIds].map(
        (tagId): TagAttachment => ({ tagId, source: "manual", confirmed: true }),
      ),
      ...[...propertyTagIds].map(
        (tagId): TagAttachment => ({ tagId, source: "manual", confirmed: true }),
      ),
    ];

    onSave(ingredient!.id, { name: trimmed, category, tags });
    onClose();
  }

  function toggleAllergenTag(tagId: string) {
    setAllergenTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  function togglePropertyTag(tagId: string) {
    setPropertyTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-bg-card rounded-xl shadow-elevated border border-border w-full max-w-lg mx-3 animate-fade-in">
        <div className="px-6 pt-6 pb-2">
          <h3 className="font-display text-base font-semibold">食材を編集</h3>
        </div>

        <div className="px-6 pb-5 space-y-4">
          {/* 食材名 */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">食材名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-card placeholder:text-text-muted/50 focus:border-primary/50"
            />
            {error && <p className="text-xs text-ng mt-1">{error}</p>}
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">カテゴリ</label>
            <div className="flex gap-3">
              {categories.map((c) => (
                <label key={c.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={c.value}
                    checked={category === c.value}
                    onChange={() => setCategory(c.value)}
                    className="accent-primary"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>

          {/* アレルゲンタグ */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">アレルゲンタグ</label>
            <div className="flex flex-wrap gap-1">
              {allergenTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleAllergenTag(tag.id)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-pointer transition-colors ${
                    allergenTagIds.has(tag.id)
                      ? tag.category === "allergen_mandatory"
                        ? "bg-ng text-white border-ng"
                        : "bg-caution text-white border-caution"
                      : "bg-bg-cream text-text-muted border-border-light hover:border-primary/30"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* 特性タグ */}
          <PropertyTagsEditor selectedTagIds={propertyTagIds} onToggle={togglePropertyTag} />
        </div>

        <div className="flex justify-end gap-2 px-6 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-cream transition-colors cursor-pointer"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors cursor-pointer"
          >
            保存
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
