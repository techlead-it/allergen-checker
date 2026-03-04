import { useMemo, useState } from "react";
import { useIngredients } from "../hooks/useIngredients";
import { useRecipes } from "../hooks/useRecipes";
import { IngredientEditModal } from "../components/IngredientEditModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { TagChip } from "../components/TagChip";
import {
  syncIngredientInRecipes,
  countIngredientUsage,
  getIngredientUsageNames,
} from "../utils/ingredientCascade";
import { findTagById } from "../data/tags";
import type { Ingredient } from "../data/types";

const categoryFilters = ["すべて", "主食材", "調味料", "共通仕込み"] as const;
type CategoryFilter = (typeof categoryFilters)[number];

export function IngredientMasterPage() {
  const { ingredients, updateIngredient, deleteIngredient } = useIngredients();
  const [recipes, setRecipes] = useRecipes();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("すべて");
  const [editTarget, setEditTarget] = useState<Ingredient | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return ingredients.filter((i) => {
      if (categoryFilter !== "すべて" && i.category !== categoryFilter) return false;
      if (search && !i.name.includes(search)) return false;
      return true;
    });
  }, [ingredients, search, categoryFilter]);

  const existingNames = useMemo(() => ingredients.map((i) => i.name), [ingredients]);

  function handleSave(id: number, updates: Partial<Omit<Ingredient, "id">>) {
    updateIngredient(id, updates);
    const updated = { ...ingredients.find((i) => i.id === id)!, ...updates };
    setRecipes(syncIngredientInRecipes(recipes, updated));
  }

  function handleDelete() {
    if (deleteTargetId === null) return;
    deleteIngredient(deleteTargetId);
    setDeleteTargetId(null);
  }

  const deleteTarget =
    deleteTargetId !== null ? ingredients.find((i) => i.id === deleteTargetId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-base font-medium text-text-secondary">食材マスタ</h3>
          <span className="text-xs text-text-muted bg-bg-cream border border-border-light rounded-full px-2.5 py-0.5">
            {filtered.length} / {ingredients.length} 件
          </span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="食材名で検索..."
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-bg-card placeholder:text-text-muted/50 focus:border-primary/50"
        />
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categoryFilters.map((f) => (
            <button
              key={f}
              onClick={() => setCategoryFilter(f)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                categoryFilter === f
                  ? "bg-primary text-white shadow-card"
                  : "bg-bg-card text-text-secondary border border-border hover:border-primary/30"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const usageCount = countIngredientUsage(recipes, item.id);
          const usageNames = getIngredientUsageNames(recipes, item.id);
          const isUsed = usageCount > 0;

          return (
            <div
              key={item.id}
              className="bg-bg-card border border-border rounded-xl p-5 hover:shadow-elevated transition-all"
            >
              {/* Name & Category */}
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-display font-medium text-base">{item.name}</h4>
                <span
                  className={`text-[11px] font-medium rounded px-2 py-0.5 shrink-0 ml-2 ${
                    item.category === "主食材"
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : item.category === "調味料"
                        ? "bg-caution-bg text-caution border border-caution-border"
                        : "bg-bg-cream text-text-muted border border-border-light"
                  }`}
                >
                  {item.category}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3 min-h-[24px]">
                {item.tags.length === 0 ? (
                  <span className="text-xs text-text-muted">タグなし</span>
                ) : (
                  item.tags.map((att) => {
                    const tag = findTagById(att.tagId);
                    if (!tag) return null;
                    return <TagChip key={tag.id} tag={tag} attachment={att} />;
                  })
                )}
              </div>

              {/* Usage info */}
              <p className="text-xs text-text-muted mb-4">
                {isUsed ? (
                  <span title={usageNames.join(", ")}>{usageCount}個のレシピで使用中</span>
                ) : (
                  "未使用"
                )}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditTarget(item)}
                  className="text-xs font-medium text-primary hover:text-primary-dark cursor-pointer"
                >
                  編集
                </button>
                <button
                  onClick={() => !isUsed && setDeleteTargetId(item.id)}
                  disabled={isUsed}
                  className={`text-xs font-medium cursor-pointer ${
                    isUsed ? "text-text-muted/40 cursor-not-allowed" : "text-ng hover:text-ng/80"
                  }`}
                  title={isUsed ? `${usageCount}個のレシピで使用中のため削除できません` : ""}
                >
                  削除
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-text-muted">
          {ingredients.length === 0
            ? "食材がまだ登録されていません。食材取込から追加してください。"
            : "条件に一致する食材がありません。"}
        </div>
      )}

      {/* Edit Modal */}
      <IngredientEditModal
        open={editTarget !== null}
        ingredient={editTarget}
        existingNames={existingNames}
        onSave={handleSave}
        onClose={() => setEditTarget(null)}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={deleteTargetId !== null}
        title="食材を削除"
        message={`「${deleteTarget?.name ?? ""}」を削除しますか？この操作は元に戻せません。`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
