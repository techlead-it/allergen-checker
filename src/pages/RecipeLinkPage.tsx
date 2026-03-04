import { useState } from "react";
import type { Ingredient, IngredientCategory, Recipe } from "../data/mock";
import type { CookingState } from "../data/types";
import { useRecipes } from "../hooks/useRecipes";
import { useIngredients } from "../hooks/useIngredients";

const cookingStateLabels: Record<CookingState, string> = {
  raw: "生",
  cooked: "加熱済",
  semi_raw: "半生",
};

const categories: IngredientCategory[] = ["主食材", "調味料", "共通仕込み"];

type View = "list" | "detail" | "create";

export function RecipeLinkPage() {
  const [view, setView] = useState<View>("list");
  const [recipeList, setRecipeList] = useRecipes();
  const [availableIngredients] = useIngredients();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [search, setSearch] = useState("");

  const selectedRecipe = recipeList.find((r) => r.id === selectedId) ?? null;

  const linked = selectedRecipe?.linkedIngredients ?? [];
  const linkedIds = new Set(linked.map((i) => i.id));
  const filtered = availableIngredients.filter(
    (i) => !linkedIds.has(i.id) && (search === "" || i.name.includes(search)),
  );

  function openDetail(id: number) {
    setSelectedId(id);
    setSearch("");
    setView("detail");
  }

  function addIngredient(item: Ingredient) {
    if (!selectedId) return;
    setRecipeList((prev) =>
      prev.map((r) =>
        r.id === selectedId
          ? {
              ...r,
              linkedIngredients: [...r.linkedIngredients, item],
              ingredientLinks: [
                ...r.ingredientLinks,
                { ingredientId: item.id, cookingState: "cooked" as const },
              ],
            }
          : r,
      ),
    );
  }

  function removeIngredient(itemId: number) {
    if (!selectedId) return;
    setRecipeList((prev) =>
      prev.map((r) =>
        r.id === selectedId
          ? {
              ...r,
              linkedIngredients: r.linkedIngredients.filter((i) => i.id !== itemId),
              ingredientLinks: r.ingredientLinks.filter((l) => l.ingredientId !== itemId),
            }
          : r,
      ),
    );
  }

  function changeCookingState(itemId: number, state: CookingState) {
    if (!selectedId) return;
    setRecipeList((prev) =>
      prev.map((r) =>
        r.id === selectedId
          ? {
              ...r,
              ingredientLinks: r.ingredientLinks.map((l) =>
                l.ingredientId === itemId ? { ...l, cookingState: state } : l,
              ),
            }
          : r,
      ),
    );
  }

  function createRecipe() {
    if (!newName.trim()) return;
    const newRecipe: Recipe = {
      id: Math.max(...recipeList.map((r) => r.id)) + 1,
      name: newName.trim(),
      version: "v2026-02",
      linkedIngredients: [],
      ingredientLinks: [],
    };
    setRecipeList((prev) => [...prev, newRecipe]);
    setNewName("");
    setSelectedId(newRecipe.id);
    setSearch("");
    setView("detail");
  }

  // ─── List View ───
  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-medium text-text-secondary">レシピ一覧</h3>
          <button
            id="recipe-create-btn"
            onClick={() => {
              setNewName("");
              setView("create");
            }}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors cursor-pointer"
          >
            + 新規作成
          </button>
        </div>

        <div
          id="recipe-list-section"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {recipeList.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => openDetail(recipe.id)}
              className="bg-bg-card border border-border rounded-xl p-5 text-left hover:border-primary/40 hover:shadow-elevated transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-display font-medium text-base group-hover:text-primary transition-colors">
                  {recipe.name}
                </h4>
                <span className="text-[11px] text-text-muted bg-bg-cream border border-border-light rounded px-2 py-0.5 shrink-0 ml-2">
                  {recipe.version}
                </span>
              </div>
              <p className="text-sm text-text-muted">
                食材数:{" "}
                <span className="font-medium text-text-secondary">
                  {recipe.linkedIngredients.length}
                </span>{" "}
                件
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {recipe.linkedIngredients.slice(0, 4).map((ing) => (
                  <span
                    key={ing.id}
                    className="text-[11px] px-1.5 py-0.5 bg-bg-cream border border-border-light rounded text-text-muted"
                  >
                    {ing.name}
                  </span>
                ))}
                {recipe.linkedIngredients.length > 4 && (
                  <span className="text-[11px] px-1.5 py-0.5 text-text-muted">
                    +{recipe.linkedIngredients.length - 4}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Create View ───
  if (view === "create") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setView("list")}
          className="text-sm text-primary hover:text-primary-dark font-medium cursor-pointer"
        >
          ← 一覧に戻る
        </button>

        <div className="bg-bg-card border border-border rounded-xl p-6 shadow-card max-w-lg">
          <h3 className="font-display text-base font-medium text-text-secondary mb-4">
            新規料理登録
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">料理名</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例: 鯛のお造り"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-card placeholder:text-text-muted/50 focus:border-primary/50"
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === "Enter") createRecipe();
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setView("list")}
                className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-cream transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={createRecipe}
                disabled={!newName.trim()}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                作成して食材を紐づける
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Detail View ───
  return (
    <div className="space-y-6">
      <button
        onClick={() => setView("list")}
        className="text-sm text-primary hover:text-primary-dark font-medium cursor-pointer"
      >
        ← 一覧に戻る
      </button>

      {/* Recipe selector */}
      <div className="bg-bg-card border border-border rounded-lg px-5 py-3 flex items-center gap-4">
        <span className="text-sm text-text-secondary">料理選択:</span>
        <span className="text-sm font-medium">{selectedRecipe?.name}</span>
        <span className="text-xs text-text-muted bg-bg-cream border border-border-light rounded px-2 py-0.5">
          {selectedRecipe?.version}
        </span>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Available */}
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-4 py-3 border-b border-border bg-bg-cream/40">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              利用可能な食材・調味料
            </h4>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="検索..."
              className="w-full px-3 py-1.5 text-sm border border-border rounded-lg bg-bg-card placeholder:text-text-muted/50 focus:border-primary/50"
            />
          </div>
          <ul className="divide-y divide-border-light max-h-80 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-text-muted">該当なし</li>
            )}
            {filtered.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between px-4 py-3 md:py-2.5 hover:bg-bg-cream/30 transition-colors"
              >
                <div>
                  <span className="text-sm">{item.name}</span>
                  <span className="text-[11px] text-text-muted ml-2">{item.category}</span>
                </div>
                <button
                  onClick={() => addIngredient(item)}
                  className="text-xs text-primary hover:text-primary-dark font-medium cursor-pointer"
                >
                  追加 →
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Linked */}
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-4 py-3 border-b border-border bg-bg-cream/40">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              この料理に紐づいた項目
            </h4>
            <p className="text-xs text-text-muted mt-0.5">{linked.length} 件</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {categories.map((cat) => {
              const items = linked.filter((i) => i.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="px-4 py-2 text-[11px] font-semibold text-accent uppercase tracking-wider bg-bg-cream/30">
                    {cat}
                  </div>
                  <ul className="divide-y divide-border-light">
                    {items.map((item) => {
                      const link = selectedRecipe?.ingredientLinks.find(
                        (l) => l.ingredientId === item.id,
                      );
                      const currentState = link?.cookingState ?? "cooked";
                      return (
                        <li
                          key={item.id}
                          className="flex items-center justify-between px-4 py-2.5 hover:bg-bg-cream/30 transition-colors gap-2"
                        >
                          <span className="text-sm flex-1">{item.name}</span>
                          <select
                            value={currentState}
                            onChange={(e) =>
                              changeCookingState(item.id, e.target.value as CookingState)
                            }
                            className="text-[11px] px-2 py-1 border border-border rounded bg-bg-card text-text-secondary cursor-pointer"
                          >
                            {(Object.entries(cookingStateLabels) as [CookingState, string][]).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ),
                            )}
                          </select>
                          <button
                            onClick={() => removeIngredient(item.id)}
                            className="text-xs text-ng/70 hover:text-ng font-medium cursor-pointer shrink-0"
                          >
                            × 除外
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
            {linked.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-text-muted">
                <span className="md:hidden">上のリストから食材を追加してください</span>
                <span className="hidden md:inline">左のリストから食材を追加してください</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
