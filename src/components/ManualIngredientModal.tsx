import { useState, useRef } from "react";
import type { ImportedIngredient, RawMaterial } from "../data/mock";
import { Modal } from "./Modal";
import { RawMaterialsEditor, type RawMaterialsEditorHandle } from "./RawMaterialsEditor";
import { PropertyTagsEditor } from "./PropertyTagsEditor";
import type { TagAttachment } from "../data/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (ingredient: ImportedIngredient) => void;
};

let manualIdCounter = 900;

export function ManualIngredientModal({ open, onClose, onSave }: Props) {
  const rawMaterialsRef = useRef<RawMaterialsEditorHandle>(null);
  const [name, setName] = useState("");
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  function reset() {
    setName("");
    setMaterials([]);
    setSelectedTagIds(new Set());
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;

    const pending = rawMaterialsRef.current?.flushPending();
    const finalMaterials = pending ? [...materials, pending] : materials;

    const tags: TagAttachment[] = [...selectedTagIds].map((tagId) => ({
      tagId,
      source: "manual" as const,
      confirmed: true,
    }));

    const ingredient: ImportedIngredient = {
      id: ++manualIdCounter,
      sourceFile: "手動入力",
      name: trimmed,
      rawMaterials: finalMaterials,
      status: "要確認",
      tags,
    };

    onSave(ingredient);
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="食材を手動登録">
      <div className="space-y-5">
        {/* 食材名 */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-muted uppercase">食材名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 本みりん"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-card focus:border-primary focus:outline-none"
          />
        </div>

        {/* 食材特性タグ */}
        <PropertyTagsEditor selectedTagIds={selectedTagIds} onToggle={toggleTag} />

        {/* 原材料 */}
        <RawMaterialsEditor
          ref={rawMaterialsRef}
          materials={materials}
          onMaterialsChange={setMaterials}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-cream transition-colors cursor-pointer"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            保存
          </button>
        </div>
      </div>
    </Modal>
  );
}
