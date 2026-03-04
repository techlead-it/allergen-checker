import { useState, forwardRef, useImperativeHandle } from "react";
import type { RawMaterial } from "../data/mock";
import { getTagsByCategory } from "../data/tags";

const allergenTags = [
  ...getTagsByCategory("allergen_mandatory"),
  ...getTagsByCategory("allergen_recommended"),
];

export type RawMaterialsEditorHandle = {
  flushPending: () => RawMaterial | null;
};

type Props = {
  materials: RawMaterial[];
  onMaterialsChange: (materials: RawMaterial[]) => void;
};

export const RawMaterialsEditor = forwardRef<RawMaterialsEditorHandle, Props>(
  function RawMaterialsEditor({ materials, onMaterialsChange }, ref) {
    const [newName, setNewName] = useState("");
    const [newAllergens, setNewAllergens] = useState<string[]>([]);

    useImperativeHandle(ref, () => ({
      flushPending(): RawMaterial | null {
        const trimmed = newName.trim();
        if (!trimmed) return null;
        const pending: RawMaterial = { name: trimmed, allergens: [...newAllergens] };
        setNewName("");
        setNewAllergens([]);
        return pending;
      },
    }));

    function removeMaterial(idx: number) {
      onMaterialsChange(materials.filter((_, i) => i !== idx));
    }

    function toggleMaterialAllergen(idx: number, allergen: string) {
      onMaterialsChange(
        materials.map((m, i) => {
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
      onMaterialsChange([...materials, { name: trimmed, allergens: [...newAllergens] }]);
      setNewName("");
      setNewAllergens([]);
    }

    function toggleNewAllergen(allergen: string) {
      if (!newName.trim()) {
        // 原材料名が空 → アレルゲン品目自体を原材料として即追加
        onMaterialsChange([...materials, { name: allergen, allergens: [allergen] }]);
        return;
      }
      // 原材料名が入力済み → 従来通りアレルゲン選択トグル
      setNewAllergens((prev) =>
        prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen],
      );
    }

    return (
      <>
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
                <th className="py-2 px-3 text-center text-[11px] font-semibold text-text-muted uppercase w-16">
                  削除
                </th>
              </tr>
            </thead>
            <tbody>
              {materials.map((mat, idx) => (
                <tr
                  key={`${mat.name}-${idx}`}
                  className="border-b border-border-light last:border-0"
                >
                  <td className="py-2 px-3 font-medium">{mat.name}</td>
                  <td className="py-2 px-3">
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
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeMaterial(idx)}
                      className="text-xs text-ng hover:text-ng/80 font-medium cursor-pointer"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-sm text-text-muted">
                    原材料が登録されていません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add new material */}
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
      </>
    );
  },
);
