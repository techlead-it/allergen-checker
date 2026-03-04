import { useState } from "react";
import { useAssignments } from "../hooks/useAssignments";
import { useCustomers } from "../hooks/useCustomers";
import { useCourses } from "../hooks/useCourses";
import { useRecipes } from "../hooks/useRecipes";
import { resolveCustomizedDishes, customizationLabel } from "../utils/resolveCustomizedDishes";
import { restrictionNames, checkDishByTags, buildDishIngredients } from "../utils/tagCheck";

import { allTags, findTagById, cookingStateRules } from "../data/tags";
import { TagChip } from "../components/TagChip";
import type { ResolvedDish } from "../utils/resolveCustomizedDishes";
import type {
  Recipe,
  CustomIngredient,
  Ingredient,
  CookingState,
  CustomerRestriction,
} from "../data/types";

const cookingStateLabels: Record<CookingState, string> = {
  raw: "生",
  cooked: "加熱済",
  semi_raw: "半生",
};

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

// ─── ヘルパー関数 ───

function getOriginalRecipeName(originalDishId: number, allRecipes: Recipe[]): string {
  return allRecipes.find((r) => r.id === originalDishId)?.name ?? "不明";
}

function getModifiedIngredients(
  customIngredients: CustomIngredient[],
  originalIngredients: Ingredient[],
): { before: string; after: string }[] {
  const result: { before: string; after: string }[] = [];
  for (let i = 0; i < customIngredients.length; i++) {
    if (customIngredients[i].isModified) {
      const before = originalIngredients[i]?.name ?? "不明";
      const after = customIngredients[i].name;
      result.push({ before, after });
    }
  }
  return result;
}

function getExcludedIngredientNames(excludedIds: number[], ingredients: Ingredient[]): string[] {
  return excludedIds
    .map((id) => ingredients.find((ing) => ing.id === id)?.name)
    .filter((n): n is string => n != null);
}

function countCustomizations(resolvedDishes: ResolvedDish[]) {
  let replaceCount = 0;
  let modifyCount = 0;
  let excludeIngCount = 0;
  let removeDishCount = 0;

  for (const d of resolvedDishes) {
    if (!d.customization) continue;
    if (d.customization.action === "replace") replaceCount++;
    if (d.customization.action === "remove") removeDishCount++;
    if (
      d.customization.action === "modify" &&
      d.customization.customIngredients?.some((i) => i.isModified)
    ) {
      modifyCount++;
    }
    if (d.excludedIngredientIds.length > 0 && d.customization.action !== "remove") {
      excludeIngCount++;
    }
  }

  return { replaceCount, modifyCount, excludeIngCount, removeDishCount };
}

function actionBadgeClass(action?: string): string {
  switch (action) {
    case "replace":
      return "bg-primary/10 text-primary border-primary/30";
    case "modify":
      return "bg-caution-bg text-caution border-caution-border";
    default:
      return "bg-ng-bg text-ng border-ng-border";
  }
}

// ─── サブコンポーネント ───

function ChangeSummaryBar({
  replaceCount,
  modifyCount,
  excludeIngCount,
  removeDishCount,
}: {
  replaceCount: number;
  modifyCount: number;
  excludeIngCount: number;
  removeDishCount: number;
}) {
  const total = replaceCount + modifyCount + excludeIngCount + removeDishCount;
  if (total === 0) return null;

  const items: string[] = [];
  if (replaceCount > 0) items.push(`差し替え${replaceCount}件`);
  if (modifyCount > 0) items.push(`食材変更${modifyCount}件`);
  if (excludeIngCount > 0) items.push(`食材除外${excludeIngCount}件`);
  if (removeDishCount > 0) items.push(`料理除外${removeDishCount}件`);

  return (
    <div className="px-5 py-2.5 bg-caution-bg border-b border-caution-border/50 print:bg-yellow-50">
      <p className="text-sm font-bold text-caution">要対応: {items.join(" / ")}</p>
    </div>
  );
}

function ReplaceDetail({
  originalName,
  newName,
  note,
}: {
  originalName: string;
  newName: string;
  note?: string;
}) {
  return (
    <div className="ml-6 mt-2 border-l-4 border-primary bg-primary/5 rounded-r-lg p-3 print:bg-blue-50">
      <div className="text-xs font-bold text-primary mb-2">差し替え</div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="bg-white border rounded px-3 py-1.5 text-sm line-through text-text-muted">
          {originalName}
        </div>
        <span className="text-primary font-bold">→</span>
        <div className="bg-white border-2 border-primary rounded px-3 py-1.5 text-sm font-bold">
          {newName}
        </div>
      </div>
      {note && <p className="mt-2 text-xs text-text-secondary">理由: {note}</p>}
    </div>
  );
}

function ModifyDetail({
  modifiedIngredients,
}: {
  modifiedIngredients: { before: string; after: string }[];
}) {
  if (modifiedIngredients.length === 0) return null;
  return (
    <div className="ml-6 mt-2 border-l-4 border-caution bg-caution-bg/40 rounded-r-lg p-3 print:bg-yellow-50">
      <div className="text-xs font-bold text-caution mb-2">食材変更</div>
      {modifiedIngredients.map(({ before, after }, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="line-through text-text-muted">{before}</span>
          <span className="text-caution font-bold">→</span>
          <span className="font-bold text-caution">{after}</span>
        </div>
      ))}
    </div>
  );
}

function ExclusionDetail({ excludedIngredients }: { excludedIngredients: string[] }) {
  if (excludedIngredients.length === 0) return null;
  return (
    <div className="ml-6 mt-2 border-l-4 border-ng bg-ng-bg/40 rounded-r-lg p-3 print:bg-red-50">
      <div className="text-xs font-bold text-ng mb-2">食材除外</div>
      {excludedIngredients.map((name) => (
        <div key={name} className="flex items-center gap-2 text-sm">
          <span className="line-through text-text-muted">{name}</span>
          <span className="text-ng text-xs">除外</span>
        </div>
      ))}
    </div>
  );
}

function CookingStateChangeDetail({
  recipe,
  cookingStateOverrides,
}: {
  recipe: Recipe;
  cookingStateOverrides: Record<number, CookingState>;
}) {
  const changes: { name: string; before: string; after: string }[] = [];
  for (const [idStr, newState] of Object.entries(cookingStateOverrides)) {
    const ingId = Number(idStr);
    const link = recipe.ingredientLinks.find((l) => l.ingredientId === ingId);
    if (!link || link.cookingState === newState) continue;
    const ing = recipe.linkedIngredients.find((i) => i.id === ingId);
    changes.push({
      name: ing?.name ?? `食材${ingId}`,
      before: cookingStateLabels[link.cookingState],
      after: cookingStateLabels[newState],
    });
  }
  if (changes.length === 0) return null;
  return (
    <div className="ml-6 mt-2 border-l-4 border-primary bg-primary/5 rounded-r-lg p-3 print:bg-blue-50">
      <div className="text-xs font-bold text-primary mb-2">調理状態変更</div>
      {changes.map((c) => (
        <div key={c.name} className="flex items-center gap-2 text-sm">
          <span className="font-medium">{c.name}</span>
          <span className="text-text-muted line-through">{c.before}</span>
          <span className="text-primary font-bold">→</span>
          <span className="font-bold text-primary">{c.after}</span>
        </div>
      ))}
    </div>
  );
}

function RiskReasonDetail({
  recipe,
  customerRestrictions,
  excludedIngredientIds,
  cookingStateOverrides,
}: {
  recipe: Recipe;
  customerRestrictions: CustomerRestriction[];
  excludedIngredientIds: number[];
  cookingStateOverrides: Record<number, CookingState>;
}) {
  const dishIngredients = buildDishIngredients(recipe).map((di) => {
    const override = cookingStateOverrides[di.ingredientId];
    return override ? { ...di, cookingState: override } : di;
  });
  const result = checkDishByTags(
    dishIngredients,
    customerRestrictions,
    allTags,
    cookingStateRules,
    excludedIngredientIds,
  );

  const riskReasons = result.matchedReasons.filter((r) => r.category === "risk" && r.derivedFrom);

  if (riskReasons.length === 0) return null;

  return (
    <div className="ml-6 mt-2 border-l-4 border-ng bg-ng-bg/40 rounded-r-lg p-3 print:bg-red-50">
      <div className="text-xs font-bold text-ng mb-2">妊婦制限</div>
      {riskReasons.map((r) => (
        <div key={r.tagId} className="flex items-center gap-1.5 text-sm">
          <span className="text-ng font-bold">!</span>
          <span className="font-medium">
            {r.derivedFrom!.ingredientName ?? r.derivedFrom!.sourceTagName}（
            {cookingStateLabels[r.derivedFrom!.cookingState]}）
          </span>
          <span className="text-text-muted">→</span>
          <span className="text-text-secondary text-xs">{r.derivedFrom!.ruleDescription}</span>
        </div>
      ))}
    </div>
  );
}

// ─── メインコンポーネント ───

export function KitchenPage() {
  const [assignments] = useAssignments();
  const [customers] = useCustomers();
  const [courseList] = useCourses();
  const [allRecipes] = useRecipes();

  const today = new Date().toISOString().slice(0, 10);
  const [filterDate, setFilterDate] = useState(today);
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

  const toggleCollapse = (id: number) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const sharedAssignments = assignments.filter(
    (a) => a.status === "厨房共有済" && (!filterDate || a.date === filterDate),
  );

  return (
    <div className="space-y-4 print:space-y-6">
      {/* フィルタ＋印刷ボタン（印刷時は非表示） */}
      <div id="kitchen-header" className="flex items-center justify-between print:hidden">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          日付:
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg text-sm bg-bg-card focus:border-primary/50 focus:shadow-card outline-none"
          />
        </label>
        <button
          id="kitchen-print-btn"
          onClick={() => window.print()}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-light transition-colors cursor-pointer"
        >
          印刷
        </button>
      </div>

      {/* 印刷用ヘッダー */}
      <div className="hidden print:block text-center mb-4">
        <h2 className="text-lg font-bold">厨房連携シート</h2>
        <p className="text-sm text-text-muted">{filterDate}</p>
      </div>

      {sharedAssignments.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-xl px-6 py-12 text-center text-text-muted text-sm print:border-none">
          {filterDate
            ? `${formatDateShort(filterDate)} の厨房共有済データはありません`
            : "厨房共有済のデータはありません"}
        </div>
      ) : (
        <div id="kitchen-sheets" className="space-y-4 print:space-y-6">
          {sharedAssignments.map((assignment) => {
            const customer = customers.find((c) => c.id === assignment.customerId);
            const course = courseList.find((c) => c.id === assignment.courseId);
            if (!customer || !course) return null;

            const resolvedDishes = resolveCustomizedDishes(
              course.dishIds,
              allRecipes,
              assignment.customizations,
            );
            const activeDishes = resolvedDishes.filter((d) => !d.isRemoved);
            const removedDishes = resolvedDishes.filter((d) => d.isRemoved);
            const counts = countCustomizations(resolvedDishes);

            return (
              <div
                key={assignment.id}
                className="bg-bg-card border border-border rounded-xl shadow-card overflow-hidden print:shadow-none print:break-inside-avoid print:border-2 print:border-text"
              >
                {/* 顧客情報ヘッダー（クリックで折り畳み） */}
                <button
                  type="button"
                  onClick={() => toggleCollapse(assignment.id)}
                  className="w-full text-left px-5 py-4 bg-primary-dark text-white print:bg-white print:text-text print:border-b-2 print:border-text cursor-pointer"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-white/70 transition-transform print:hidden ${collapsedIds.has(assignment.id) ? "-rotate-90" : ""}`}
                      >
                        ▼
                      </span>
                      <div>
                        <h3 className="font-display text-lg font-medium print:text-xl print:font-bold">
                          {customer.name}
                        </h3>
                        <p className="text-sm text-white/70 print:text-text-secondary">
                          {customer.roomName} / {course.name} / {formatDateShort(assignment.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {customer.restrictions.map((r) => {
                        const tag = findTagById(r.tagId);
                        if (!tag) return null;
                        return (
                          <span key={tag.id} className="print:hidden">
                            <TagChip
                              tag={tag}
                              attachment={{ tagId: tag.id, source: "master", confirmed: true }}
                            />
                          </span>
                        );
                      })}
                      {/* 印刷用テキスト表示 */}
                      {restrictionNames(customer.restrictions, allTags).map((name) => (
                        <span
                          key={name}
                          className="hidden print:inline-block px-2 py-0.5 bg-ng-bg text-ng border border-ng-border rounded text-xs font-semibold"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                  {customer.condition && (
                    <p className="mt-1 text-xs text-white/60 print:text-text-muted">
                      条件: {customer.condition} / コンタミ: {customer.contamination}
                    </p>
                  )}
                </button>

                {!collapsedIds.has(assignment.id) && (
                  <>
                    {/* 変更サマリーバー */}
                    <ChangeSummaryBar {...counts} />

                    {/* 料理リスト */}
                    <div className="divide-y divide-border-light">
                      {activeDishes.map(
                        ({ recipe, customization, isCustomized, excludedIngredientIds }, idx) => {
                          const modifiedIngs =
                            customization?.action === "modify" && customization.customIngredients
                              ? getModifiedIngredients(
                                  customization.customIngredients,
                                  recipe.linkedIngredients,
                                )
                              : [];

                          const excludedIngNames =
                            excludedIngredientIds.length > 0 && customization?.action !== "remove"
                              ? getExcludedIngredientNames(
                                  excludedIngredientIds,
                                  recipe.linkedIngredients,
                                )
                              : [];

                          const originalName =
                            customization?.action === "replace"
                              ? getOriginalRecipeName(customization.originalDishId, allRecipes)
                              : "";

                          const label = customization
                            ? (customizationLabel(customization.action) ??
                              (excludedIngredientIds.length > 0 ? "食材除外" : undefined))
                            : undefined;

                          return (
                            <div
                              key={`${recipe.id}-${idx}`}
                              className={`px-5 py-3 ${isCustomized ? "bg-caution-bg/20 print:bg-gray-50" : ""}`}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-text-muted text-sm font-mono">
                                  {idx + 1}.
                                </span>
                                {isCustomized && (
                                  <span className="text-sm font-bold print:text-lg">★</span>
                                )}
                                <span
                                  className={`text-sm font-medium ${isCustomized ? "font-bold" : ""}`}
                                >
                                  {recipe.name}
                                </span>
                                {isCustomized && label && (
                                  <span
                                    className={`px-2 py-0.5 border rounded text-[11px] font-semibold print:bg-gray-200 print:text-text print:border-text ${actionBadgeClass(customization?.action)}`}
                                  >
                                    {label}
                                  </span>
                                )}
                              </div>

                              {/* 差し替え詳細 */}
                              {customization?.action === "replace" && (
                                <ReplaceDetail
                                  originalName={originalName}
                                  newName={recipe.name}
                                  note={customization.note || undefined}
                                />
                              )}

                              {/* 食材変更詳細 */}
                              <ModifyDetail modifiedIngredients={modifiedIngs} />

                              {/* 食材除外詳細 */}
                              <ExclusionDetail excludedIngredients={excludedIngNames} />

                              {/* 調理状態変更詳細 */}
                              <CookingStateChangeDetail
                                recipe={recipe}
                                cookingStateOverrides={customization?.cookingStateOverrides ?? {}}
                              />

                              {/* 妊婦制限の具体的理由 */}
                              <RiskReasonDetail
                                recipe={recipe}
                                customerRestrictions={customer.restrictions}
                                excludedIngredientIds={excludedIngredientIds}
                                cookingStateOverrides={customization?.cookingStateOverrides ?? {}}
                              />

                              {/* 変更理由（差し替え以外） */}
                              {customization?.note &&
                                customization.action !== "replace" &&
                                isCustomized && (
                                  <p className="ml-6 mt-2 text-xs text-text-secondary">
                                    理由: {customization.note}
                                  </p>
                                )}
                            </div>
                          );
                        },
                      )}
                    </div>

                    {/* 除外された料理 */}
                    {removedDishes.length > 0 && (
                      <div className="px-5 py-3 bg-ng-bg/30 border-t-2 border-ng/30 print:bg-red-50">
                        <div className="text-xs font-bold text-ng mb-2">除外された料理</div>
                        {removedDishes.map((d) => (
                          <div key={d.recipe.id} className="flex items-center gap-2 py-1">
                            <span className="text-ng font-bold">✕</span>
                            <span className="text-sm line-through text-text-muted">
                              {d.recipe.name}
                            </span>
                            {d.customization?.note && (
                              <span className="text-xs text-text-secondary ml-2">
                                理由: {d.customization.note}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 厨房メモ */}
                    {assignment.kitchenNote && (
                      <div className="px-5 py-3 bg-caution-bg/20 border-t border-border-light print:bg-yellow-50">
                        <p className="text-sm">
                          <span className="font-semibold text-text-secondary">厨房メモ:</span>{" "}
                          {assignment.kitchenNote}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
