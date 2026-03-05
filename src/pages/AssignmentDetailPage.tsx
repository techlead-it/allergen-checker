import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAssignments } from "../hooks/useAssignments";
import { useCustomers } from "../hooks/useCustomers";
import { useCourses } from "../hooks/useCourses";
import { useRecipes } from "../hooks/useRecipes";
import {
  checkIngredientByTags,
  checkDishByTags,
  judgmentIcon,
  buildDishIngredients,
  restrictionNames,
} from "../utils/tagCheck";
import type { MatchedReason } from "../utils/tagCheck";
import { allTags, cookingStateRules } from "../data/tags";
import { resolveCustomizedDishes, customizationLabel } from "../utils/resolveCustomizedDishes";
import { StatusBadge } from "../components/StatusBadge";
import { SearchableSelect } from "../components/SearchableSelect";
import { Modal } from "../components/Modal";
import type {
  CustomerCourseAssignment,
  CustomerRestriction,
  CookingState,
  DishCustomization,
  CustomIngredient,
  Ingredient,
  Judgment,
  Recipe,
} from "../data/types";
import { TagChip } from "../components/TagChip";
import { findTagByName } from "../data/tags";

type CategoryGroup = {
  label: string;
  reasons: MatchedReason[];
};

function groupReasonsByCategory(reasons: MatchedReason[]): CategoryGroup[] {
  const groups: CategoryGroup[] = [];
  const legal: MatchedReason[] = [];
  const property: MatchedReason[] = [];
  const risk: MatchedReason[] = [];
  const other: MatchedReason[] = [];

  for (const r of reasons) {
    if (
      r.category === "allergen_mandatory" ||
      r.category === "allergen_recommended" ||
      r.category === "allergen_custom"
    ) {
      legal.push(r);
    } else if (r.category === "taxonomy" || r.category === "texture" || r.category === "odor") {
      property.push(r);
    } else if (r.category === "risk") {
      risk.push(r);
    } else {
      other.push(r);
    }
  }

  if (legal.length > 0) groups.push({ label: "法的アレルゲン", reasons: legal });
  if (property.length > 0) groups.push({ label: "特性一致", reasons: property });
  if (risk.length > 0) groups.push({ label: "妊婦制限", reasons: risk });
  if (other.length > 0) groups.push({ label: "その他", reasons: other });

  return groups;
}

const cookingStateLabels: Record<CookingState, string> = {
  raw: "生",
  cooked: "加熱済",
  semi_raw: "半生",
};

function MatchedTagBadges({ reasons }: { reasons: MatchedReason[] }) {
  const groups = groupReasonsByCategory(reasons);
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {groups.map((group) => (
        <div key={group.label} className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-text-muted font-medium">{group.label}:</span>
          {group.reasons.map((r) => {
            // リスクタグで導出文脈がある場合、具体的な理由を表示
            if (r.category === "risk" && r.derivedFrom) {
              return (
                <span
                  key={r.tagId}
                  className="px-1.5 py-0.5 bg-ng-bg text-ng border border-ng-border rounded text-[11px] font-semibold"
                  title={r.derivedFrom.ruleDescription}
                >
                  {r.derivedFrom.ingredientName ?? r.derivedFrom.sourceTagName}（
                  {cookingStateLabels[r.derivedFrom.cookingState]}）
                </span>
              );
            }
            const tag = findTagByName(r.tagName);
            if (tag) {
              return (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  attachment={{ tagId: tag.id, source: "master", confirmed: true }}
                  matched
                />
              );
            }
            return (
              <span
                key={r.tagId}
                className="px-1.5 py-0.5 bg-ng-bg text-ng border border-ng-border rounded text-[11px] font-semibold"
              >
                {r.tagName}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const allergenCategories = new Set([
  "allergen_mandatory",
  "allergen_recommended",
  "allergen_custom",
]);
const propertyCategories = new Set(["taxonomy", "texture", "odor", "risk"]);

function isTagInFilter(tagId: string, filter: "allergen" | "property"): boolean {
  const tag = allTags.find((t) => t.id === tagId);
  if (!tag) return false;
  const targetCategories = filter === "allergen" ? allergenCategories : propertyCategories;
  return targetCategories.has(tag.category);
}

function IngredientTagCell({
  ingredient,
  customerRestrictions,
  cookingState,
  tagFilter,
}: {
  ingredient: Ingredient;
  customerRestrictions: CustomerRestriction[];
  cookingState: "raw" | "cooked" | "semi_raw";
  tagFilter?: "allergen" | "property";
}) {
  const ingResult = checkIngredientByTags(
    ingredient.tags,
    cookingState,
    customerRestrictions,
    allTags,
    cookingStateRules,
  );

  const hasUnconfirmed = ingredient.tags.some((t) => !t.confirmed);

  // 導出タグのうちマッチしたもの（直接タグと重複しないもの）
  const directTagIds = new Set(ingredient.tags.map((t) => t.tagId));
  const derivedMatchedTags = ingResult.derivedTagIds.filter(
    (id) => ingResult.matchedTagIds.includes(id) && !directTagIds.has(id),
  );

  // tagFilterが指定されている場合、対象カテゴリのタグのみ表示
  const filteredTags = tagFilter
    ? ingredient.tags.filter((t) => isTagInFilter(t.tagId, tagFilter))
    : ingredient.tags;
  const filteredDerivedMatchedTags = tagFilter
    ? derivedMatchedTags.filter((id) => isTagInFilter(id, tagFilter))
    : derivedMatchedTags;

  if (filteredTags.length > 0 || filteredDerivedMatchedTags.length > 0) {
    const names = filteredTags.map((t) => {
      const tag = allTags.find((at) => at.id === t.tagId);
      return tag?.name ?? t.tagId;
    });
    return (
      <span className="flex flex-wrap gap-1 items-center">
        {filteredTags.map((t, i) =>
          ingResult.matchedTagIds.includes(t.tagId) ? (
            <span
              key={t.tagId}
              className="px-1.5 py-0.5 bg-ng-bg text-ng border border-ng-border rounded text-[11px] font-semibold"
            >
              {names[i]}
            </span>
          ) : (
            <span
              key={t.tagId}
              className={`text-xs ${t.confirmed ? "text-text-secondary" : "text-caution"}`}
            >
              {names[i]}
              {!t.confirmed && " ?"}
            </span>
          ),
        )}
        {filteredDerivedMatchedTags.map((id) => {
          const tag = allTags.find((t) => t.id === id);
          return (
            <span
              key={id}
              className="px-1.5 py-0.5 bg-ng-bg text-ng border border-ng-border rounded text-[11px] font-semibold"
            >
              {tag?.name ?? id}
            </span>
          );
        })}
        {!tagFilter && hasUnconfirmed && (
          <span className="px-1.5 py-0.5 bg-caution-bg text-caution border border-caution-border rounded text-[11px] font-semibold">
            未確定
          </span>
        )}
      </span>
    );
  }

  return <span className="text-text-muted text-xs">—</span>;
}

function InlineEditableCell({
  value,
  originalValue,
  onChange,
  allIngredientNames,
}: {
  value: string;
  originalValue: string;
  onChange: (newName: string) => void;
  allIngredientNames: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<HTMLUListElement>(null);

  const isModified = value !== originalValue;

  const suggestions =
    editing && draft.length > 0
      ? allIngredientNames.filter(
          (n) => n !== value && n.toLowerCase().includes(draft.toLowerCase()),
        )
      : [];

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    setHighlightIdx(0);
  }, [draft]);

  function commit(name: string) {
    const trimmed = name.trim();
    if (trimmed && trimmed !== value) {
      onChange(trimmed);
    }
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className={`text-left cursor-pointer hover:text-primary transition-colors ${
          isModified ? "border-l-2 border-primary pl-2 font-bold" : ""
        }`}
      >
        {value}
        {isModified && (
          <span className="ml-2 text-text-muted text-xs font-normal">← {originalValue}</span>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          // delay to allow suggestion click
          setTimeout(() => {
            if (editing) commit(draft);
          }, 150);
        }}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === "Enter") {
            e.preventDefault();
            if (suggestions.length > 0 && highlightIdx < suggestions.length) {
              commit(suggestions[highlightIdx]);
            } else {
              commit(draft);
            }
          } else if (e.key === "Escape") {
            cancel();
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIdx((prev) => Math.max(prev - 1, 0));
          }
        }}
        className="w-full px-2 py-1 border border-primary/50 rounded text-sm bg-white outline-none shadow-card"
      />
      {suggestions.length > 0 && (
        <ul
          ref={suggestRef}
          className="absolute left-0 top-full mt-1 w-full bg-bg-card border border-border rounded-lg shadow-elevated z-50 max-h-40 overflow-y-auto py-1"
        >
          {suggestions.slice(0, 8).map((name, idx) => (
            <li key={name}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(name);
                }}
                onMouseEnter={() => setHighlightIdx(idx)}
                className={`w-full text-left px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                  idx === highlightIdx ? "bg-primary/8" : "hover:bg-bg-cream/50"
                }`}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DishAccordion({
  dish,
  judgment,
  matchedReasons,
  isOpen,
  onToggle,
  customerRestrictions,
  customizationBadge,
  onRemoveDish,
  onOpenReplaceModal,
  onClearReplace,
  isReplaced,
  originalDishName,
  isModified,
  excludedIngredientIds,
  onToggleIngredientExclude,
  onInlineIngredientRename,
  allIngredientNames,
  customIngredients,
  cookingStateOverrides,
  onCookingStateChange,
  note,
  onNoteChange,
  isRemoved,
}: {
  dish: Recipe;
  judgment: Judgment;
  matchedReasons: MatchedReason[];
  isOpen: boolean;
  onToggle: () => void;
  customerRestrictions: CustomerRestriction[];
  customizationBadge?: string;
  onRemoveDish: () => void;
  onOpenReplaceModal: () => void;
  onClearReplace: () => void;
  isReplaced: boolean;
  originalDishName?: string;
  isModified: boolean;
  excludedIngredientIds: Set<number>;
  onToggleIngredientExclude: (ingredientId: number) => void;
  onInlineIngredientRename: (ingIdx: number, newName: string) => void;
  allIngredientNames: string[];
  customIngredients?: CustomIngredient[];
  cookingStateOverrides: Record<number, CookingState>;
  onCookingStateChange: (ingredientId: number, state: CookingState) => void;
  note: string;
  onNoteChange: (note: string) => void;
  isRemoved: boolean;
}) {
  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden shadow-card">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-3 md:px-5 md:py-4 text-left cursor-pointer hover:bg-bg-cream/30 transition-colors"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`text-sm font-bold ${
              judgment === "NG" ? "text-ng" : judgment === "要確認" ? "text-caution" : "text-ok"
            }`}
          >
            {judgmentIcon(judgment)}
          </span>
          <span className="font-display font-medium text-sm">{dish.name}</span>
          {customizationBadge && (
            <span className="px-2 py-0.5 bg-[#eef2ff] text-[#4338ca] border border-[#c7d2fe] rounded text-[11px] font-semibold">
              {customizationBadge}
            </span>
          )}
          {excludedIngredientIds.size > 0 && !customizationBadge && (
            <span className="px-2 py-0.5 bg-[#fef3c7] text-[#92400e] border border-[#fcd34d] rounded text-[11px] font-semibold">
              食材除外あり
            </span>
          )}
          {matchedReasons.length > 0 && <MatchedTagBadges reasons={matchedReasons} />}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge value={judgment} />
          <span className="text-text-muted text-xs">{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border animate-fade-in">
          {/* ツールバー */}
          <div className="px-3 py-3 md:px-5 md:py-3 bg-bg-cream/20 border-b border-border-light flex items-center gap-2 flex-wrap">
            {isReplaced ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-text-muted">差し替え元:</span>
                <span className="text-sm font-medium">{originalDishName}</span>
                <button
                  onClick={onOpenReplaceModal}
                  className="px-2 py-1 text-xs text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  変更
                </button>
                <button
                  onClick={onClearReplace}
                  className="px-2 py-1 text-xs text-ng border border-ng/30 rounded-lg hover:bg-ng/5 transition-colors cursor-pointer"
                >
                  解除
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={onOpenReplaceModal}
                  className="px-3 py-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  差し替え
                </button>
                {!isRemoved && (
                  <button
                    onClick={onRemoveDish}
                    className="px-3 py-1.5 text-xs bg-ng/10 text-ng border border-ng/20 rounded-lg hover:bg-ng/20 transition-colors cursor-pointer"
                  >
                    除外
                  </button>
                )}
              </>
            )}
          </div>

          {/* メモ（差し替え済 or 食材変更時のみ） */}
          {(isReplaced || isModified) && (
            <div className="px-3 py-3 md:px-5 border-b border-border-light">
              <input
                type="text"
                placeholder="メモ（厨房向け）"
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                className="w-full px-3 py-1.5 border border-border rounded-lg text-sm bg-bg-card focus:border-primary/50 focus:shadow-card outline-none"
              />
            </div>
          )}

          {/* リスク導出理由の詳細表示 */}
          {matchedReasons.some((r) => r.category === "risk" && r.derivedFrom) && (
            <div className="px-3 py-2.5 md:px-5 border-b border-border-light bg-ng-bg/30">
              <div className="text-[11px] font-semibold text-ng mb-1.5">妊婦制限の詳細</div>
              <ul className="space-y-1">
                {matchedReasons
                  .filter((r) => r.category === "risk" && r.derivedFrom)
                  .map((r, i) => (
                    <li
                      key={`${r.tagId}-${i}`}
                      className="flex items-center gap-1.5 text-xs text-text"
                    >
                      <span className="text-ng font-bold">!</span>
                      <span className="font-medium">
                        {r.derivedFrom!.ingredientName ?? r.derivedFrom!.sourceTagName}（
                        {cookingStateLabels[r.derivedFrom!.cookingState]}）
                      </span>
                      <span className="text-text-muted">→</span>
                      <span className="text-text-secondary">{r.derivedFrom!.ruleDescription}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* 食材テーブル */}
          <>
            {/* Mobile card layout */}
            <div className="md:hidden divide-y divide-border-light">
              {dish.linkedIngredients.map((ing, ingIdx) => {
                const link = dish.ingredientLinks.find((l) => l.ingredientId === ing.id);
                const originalCs = link?.cookingState ?? "cooked";
                const cs = cookingStateOverrides[ing.id] ?? originalCs;
                const ingResult = checkIngredientByTags(
                  ing.tags,
                  cs,
                  customerRestrictions,
                  allTags,
                  cookingStateRules,
                );
                const isExcluded = excludedIngredientIds.has(ing.id);
                const customIng = customIngredients?.[ingIdx];
                const ingDisplayName = customIng?.name ?? ing.name;
                const ingIsModified = customIng?.isModified ?? false;
                return (
                  <div
                    key={ing.id}
                    className={`px-3 py-3 space-y-1.5 ${isExcluded ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => onToggleIngredientExclude(ing.id)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
                        />
                        <span
                          className={`text-sm ${isExcluded ? "line-through text-text-muted" : ""} ${ingIsModified ? "border-l-2 border-primary pl-2 font-bold" : "font-medium"}`}
                        >
                          <InlineEditableCell
                            value={ingDisplayName}
                            originalValue={ing.name}
                            onChange={(newName) => onInlineIngredientRename(ingIdx, newName)}
                            allIngredientNames={allIngredientNames}
                          />
                        </span>
                      </div>
                      {!isExcluded && <StatusBadge value={ingResult.judgment} />}
                      {isExcluded && <span className="text-[11px] text-text-muted">除外</span>}
                    </div>
                    <div className="text-xs text-text-muted pl-6 flex items-center gap-2">
                      <span>{ing.category}</span>
                      {!isExcluded && (
                        <select
                          value={cs}
                          onChange={(e) =>
                            onCookingStateChange(ing.id, e.target.value as CookingState)
                          }
                          className={`text-xs px-1.5 py-0.5 border rounded bg-bg-card cursor-pointer ${
                            cs !== originalCs
                              ? "border-primary text-primary font-semibold"
                              : "border-border text-text-secondary"
                          }`}
                        >
                          <option value="raw">生</option>
                          <option value="semi_raw">半生</option>
                          <option value="cooked">加熱済</option>
                        </select>
                      )}
                    </div>
                    {!isExcluded && (
                      <div className="space-y-1 pl-6">
                        <div className="text-sm">
                          <span className="text-[10px] text-text-muted font-medium mr-1">
                            アレルゲン:
                          </span>
                          <IngredientTagCell
                            ingredient={ing}
                            customerRestrictions={customerRestrictions}
                            cookingState={cs}
                            tagFilter="allergen"
                          />
                        </div>
                        <div className="text-sm">
                          <span className="text-[10px] text-text-muted font-medium mr-1">
                            特性NG:
                          </span>
                          <IngredientTagCell
                            ingredient={ing}
                            customerRestrictions={customerRestrictions}
                            cookingState={cs}
                            tagFilter="property"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Desktop table layout */}
            <table className="w-full hidden md:table">
              <thead>
                <tr className="bg-bg-cream/40">
                  <th className="py-2.5 px-3 w-10" />
                  <th className="py-2.5 px-5 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-left">
                    食材名
                  </th>
                  <th className="py-2.5 px-5 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-left">
                    カテゴリ
                  </th>
                  <th className="py-2.5 px-5 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-left w-28">
                    調理状態
                  </th>
                  <th className="py-2.5 px-5 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-left">
                    含有アレルゲン
                  </th>
                  <th className="py-2.5 px-5 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-left">
                    特性NG
                  </th>
                  <th className="py-2.5 px-5 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-center w-24">
                    判定
                  </th>
                </tr>
              </thead>
              <tbody>
                {dish.linkedIngredients.map((ing, ingIdx) => {
                  const link = dish.ingredientLinks.find((l) => l.ingredientId === ing.id);
                  const originalCs = link?.cookingState ?? "cooked";
                  const cs = cookingStateOverrides[ing.id] ?? originalCs;
                  const ingResult = checkIngredientByTags(
                    ing.tags,
                    cs,
                    customerRestrictions,
                    allTags,
                    cookingStateRules,
                  );
                  const isExcluded = excludedIngredientIds.has(ing.id);
                  const customIng = customIngredients?.[ingIdx];
                  const ingDisplayName = customIng?.name ?? ing.name;
                  return (
                    <tr
                      key={ing.id}
                      className={`border-t border-border-light transition-colors ${
                        isExcluded ? "opacity-50" : "hover:bg-bg-cream/20"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => onToggleIngredientExclude(ing.id)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
                        />
                      </td>
                      <td
                        className={`py-2.5 px-5 text-sm ${isExcluded ? "line-through text-text-muted" : ""}`}
                      >
                        <InlineEditableCell
                          value={ingDisplayName}
                          originalValue={ing.name}
                          onChange={(newName) => onInlineIngredientRename(ingIdx, newName)}
                          allIngredientNames={allIngredientNames}
                        />
                      </td>
                      <td className="py-2.5 px-5 text-sm text-text-secondary">{ing.category}</td>
                      <td className="py-2.5 px-5 text-sm">
                        {isExcluded ? (
                          <span className="text-text-muted text-xs">—</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <select
                              value={cs}
                              onChange={(e) =>
                                onCookingStateChange(ing.id, e.target.value as CookingState)
                              }
                              className={`text-xs px-1.5 py-1 border rounded-lg bg-bg-card cursor-pointer focus:border-primary/50 outline-none ${
                                cs !== originalCs
                                  ? "border-primary text-primary font-semibold"
                                  : "border-border text-text-secondary"
                              }`}
                            >
                              <option value="raw">生</option>
                              <option value="semi_raw">半生</option>
                              <option value="cooked">加熱済</option>
                            </select>
                            {cs !== originalCs && (
                              <span className="text-[10px] text-primary">変更</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-5 text-sm">
                        {isExcluded ? (
                          <span className="text-text-muted text-xs">—</span>
                        ) : (
                          <IngredientTagCell
                            ingredient={ing}
                            customerRestrictions={customerRestrictions}
                            cookingState={cs}
                            tagFilter="allergen"
                          />
                        )}
                      </td>
                      <td className="py-2.5 px-5 text-sm">
                        {isExcluded ? (
                          <span className="text-text-muted text-xs">—</span>
                        ) : (
                          <IngredientTagCell
                            ingredient={ing}
                            customerRestrictions={customerRestrictions}
                            cookingState={cs}
                            tagFilter="property"
                          />
                        )}
                      </td>
                      <td className="py-2.5 px-5 text-center">
                        {isExcluded ? (
                          <span className="text-[11px] text-text-muted">除外</span>
                        ) : (
                          <StatusBadge value={ingResult.judgment} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        </div>
      )}
    </div>
  );
}

export function AssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useAssignments();
  const [customers] = useCustomers();
  const [courseList] = useCourses();
  const [allRecipes] = useRecipes();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [editingCourse, setEditingCourse] = useState(false);
  const [judgmentFilter, setJudgmentFilter] = useState<Judgment | "all" | "legal_only">("all");

  // 差し替えモーダル用state
  const [replaceModalDishId, setReplaceModalDishId] = useState<number | null>(null);
  const [replaceModalRecipeId, setReplaceModalRecipeId] = useState<number>(0);
  const [replaceModalNote, setReplaceModalNote] = useState<string>("");

  const assignment = assignments.find((a) => a.id === Number(assignmentId));

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted mb-4">割当が見つかりません</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors cursor-pointer"
        >
          ダッシュボードに戻る
        </button>
      </div>
    );
  }

  const customer = customers.find((c) => c.id === assignment.customerId);
  const course = courseList.find((c) => c.id === assignment.courseId);
  const customerRestrictions = customer?.restrictions ?? [];

  const resolvedDishes = course
    ? resolveCustomizedDishes(course.dishIds, allRecipes, assignment.customizations)
    : [];

  const activeDishes = resolvedDishes.filter((d) => !d.isRemoved);

  const dishResults = activeDishes.map(
    ({ recipe, customization, isCustomized, excludedIngredientIds }) => {
      const dishIngredients = buildDishIngredients(recipe);
      // 調理状態の上書きを適用
      const overrides = customization?.cookingStateOverrides ?? {};
      const adjustedIngredients = dishIngredients.map((ing) =>
        overrides[ing.ingredientId] ? { ...ing, cookingState: overrides[ing.ingredientId] } : ing,
      );
      const result = checkDishByTags(
        adjustedIngredients,
        customerRestrictions,
        allTags,
        cookingStateRules,
        excludedIngredientIds,
      );
      return { recipe, ...result, customization, isCustomized, excludedIngredientIds };
    },
  );

  const counts = {
    NG: dishResults.filter((r) => r.judgment === "NG").length,
    要確認: dishResults.filter((r) => r.judgment === "要確認").length,
    OK: dishResults.filter((r) => r.judgment === "OK").length,
  };

  const legalCategories = new Set([
    "allergen_mandatory",
    "allergen_recommended",
    "allergen_custom",
  ]);
  const legalOnlyCount = dishResults.filter((r) =>
    r.matchedReasons.some((mr) => mr.category != null && legalCategories.has(mr.category)),
  ).length;

  const filteredDishResults =
    judgmentFilter === "all"
      ? dishResults
      : judgmentFilter === "legal_only"
        ? dishResults.filter((r) =>
            r.matchedReasons.some((mr) => mr.category != null && legalCategories.has(mr.category)),
          )
        : dishResults.filter((r) => r.judgment === judgmentFilter);

  // 全レシピからユニーク食材名を収集
  const allIngredientNames = [
    ...new Set(allRecipes.flatMap((r) => r.linkedIngredients.map((i) => i.name))),
  ];

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const aid = assignment.id;
  const customizations = assignment.customizations;

  const currentCourseId = assignment.courseId;

  function handleCourseChange(newCourseId: number) {
    if (newCourseId === currentCourseId) {
      setEditingCourse(false);
      return;
    }
    const hasCustomizations = customizations.length > 0;
    if (
      hasCustomizations &&
      !window.confirm(
        "コースを変更すると、料理のカスタマイズ（差し替え・除外など）がリセットされます。よろしいですか？",
      )
    ) {
      return;
    }
    setAssignments((prev) =>
      prev.map((a) => (a.id === aid ? { ...a, courseId: newCourseId, customizations: [] } : a)),
    );
    setEditingCourse(false);
  }

  function updateCustomization(dishId: number, changes: Partial<DishCustomization>) {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== aid) return a;
        const existing = a.customizations.find((c) => c.originalDishId === dishId);
        let newCustomizations: DishCustomization[];
        if (existing) {
          newCustomizations = a.customizations.map((c) =>
            c.originalDishId === dishId ? { ...c, ...changes } : c,
          );
        } else {
          newCustomizations = [
            ...a.customizations,
            { originalDishId: dishId, note: "", ...changes },
          ];
        }
        // 空のカスタマイズを除去
        newCustomizations = newCustomizations.filter(
          (c) =>
            c.action != null ||
            (c.excludedIngredientIds != null && c.excludedIngredientIds.length > 0) ||
            (c.cookingStateOverrides != null && Object.keys(c.cookingStateOverrides).length > 0),
        );
        return { ...a, customizations: newCustomizations };
      }),
    );
  }

  function updateKitchenNote(note: string) {
    setAssignments((prev) => prev.map((a) => (a.id === aid ? { ...a, kitchenNote: note } : a)));
  }

  function updateStatus(status: CustomerCourseAssignment["status"]) {
    setAssignments((prev) => prev.map((a) => (a.id === aid ? { ...a, status } : a)));
  }

  function handleToggleIngredientExclude(dishId: number, ingredientId: number) {
    const c = customizations.find((c) => c.originalDishId === dishId);
    const current = new Set(c?.excludedIngredientIds ?? []);
    if (current.has(ingredientId)) {
      current.delete(ingredientId);
    } else {
      current.add(ingredientId);
    }
    updateCustomization(dishId, { excludedIngredientIds: [...current] });
  }

  function handleCookingStateChange(dishId: number, ingredientId: number, state: CookingState) {
    const c = customizations.find((c) => c.originalDishId === dishId);
    const current = { ...c?.cookingStateOverrides };
    // レシピのデフォルトに戻す場合はエントリを削除
    const dish = allRecipes.find((r) => r.id === dishId);
    const link = dish?.ingredientLinks.find((l) => l.ingredientId === ingredientId);
    const originalState = link?.cookingState ?? "cooked";
    if (state === originalState) {
      delete current[ingredientId];
    } else {
      current[ingredientId] = state;
    }
    updateCustomization(dishId, { cookingStateOverrides: current });
  }

  // 除外（1クリック）
  function handleRemoveDish(dishId: number) {
    updateCustomization(dishId, { action: "remove" });
  }

  // 差し替えモーダル操作
  function openReplaceModal(dishId: number) {
    const c = customizations.find((c) => c.originalDishId === dishId);
    setReplaceModalDishId(dishId);
    setReplaceModalRecipeId(c?.replacementDishId ?? 0);
    setReplaceModalNote(c?.note ?? "");
  }

  function saveReplaceModal() {
    if (replaceModalDishId == null || replaceModalRecipeId === 0) return;
    updateCustomization(replaceModalDishId, {
      action: "replace",
      replacementDishId: replaceModalRecipeId,
      note: replaceModalNote,
      customIngredients: undefined,
    });
    setReplaceModalDishId(null);
  }

  function cancelReplaceModal() {
    setReplaceModalDishId(null);
  }

  // 差し替え解除
  function handleClearReplace(dishId: number) {
    const existing = customizations.find((c) => c.originalDishId === dishId);
    updateCustomization(dishId, {
      action: undefined,
      replacementDishId: undefined,
      note: "",
      excludedIngredientIds: existing?.excludedIngredientIds,
    });
  }

  // インライン食材編集（暗黙的に action: "modify" を設定）
  function handleInlineIngredientRename(dishId: number, ingIdx: number, newName: string) {
    const dish = allRecipes.find((r) => r.id === dishId);
    if (!dish) return;

    const c = customizations.find((c) => c.originalDishId === dishId);
    const currentCustomIngredients: CustomIngredient[] =
      c?.customIngredients ??
      dish.linkedIngredients.map((i) => ({ name: i.name, isModified: false }));

    const updated = currentCustomIngredients.map((ing, i) => {
      if (i !== ingIdx) return ing;
      const originalName = dish.linkedIngredients[i]?.name ?? "";
      return { name: newName, isModified: newName !== originalName };
    });

    // 全て元に戻されたかチェック
    const allReverted = updated.every((ing, i) => {
      const originalName = dish.linkedIngredients[i]?.name ?? "";
      return ing.name === originalName;
    });

    if (allReverted) {
      // action: "modify" をクリア
      const existing = customizations.find((c) => c.originalDishId === dishId);
      if (existing?.action === "modify") {
        updateCustomization(dishId, {
          action: undefined,
          customIngredients: undefined,
          note: "",
          excludedIngredientIds: existing.excludedIngredientIds,
        });
      }
    } else {
      updateCustomization(dishId, {
        action: "modify",
        customIngredients: updated,
      });
    }
  }

  const courseOptions = courseList.map((c) => ({ value: c.id, label: c.name }));
  const recipeOptions = allRecipes.map((r) => ({ value: r.id, label: r.name }));

  return (
    <div className="space-y-6">
      {/* 戻るボタン */}
      <button
        onClick={() => navigate("/dashboard")}
        className="text-sm text-text-secondary hover:text-text transition-colors cursor-pointer"
      >
        ← ダッシュボードに戻る
      </button>

      {/* 顧客・コース情報 */}
      <div className="bg-bg-card border border-border rounded-xl p-5 shadow-card space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-medium">
              {customer ? (
                <button
                  onClick={() => navigate(`/customers/edit/${customer.id}`)}
                  className="text-primary hover:underline cursor-pointer"
                >
                  {customer.name}
                </button>
              ) : (
                "—"
              )}
              {customer?.presets?.includes("pregnancy") && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-pink-100 text-pink-700 border border-pink-300">
                  🤰 妊婦
                </span>
              )}{" "}
              /{" "}
              {editingCourse ? (
                <span className="inline-block align-middle w-56">
                  <SearchableSelect
                    options={courseOptions}
                    value={currentCourseId}
                    onChange={(v) => handleCourseChange(v as number)}
                  />
                </span>
              ) : (
                <button
                  onClick={() => setEditingCourse(true)}
                  className="hover:text-primary transition-colors cursor-pointer border-b border-dashed border-text-muted hover:border-primary"
                >
                  {course?.name ?? "—"}
                </button>
              )}
            </h3>
            <p className="text-sm text-text-muted mt-1">
              {customer?.roomName} / 提供日: {assignment.date}
            </p>
          </div>
          <StatusBadge value={assignment.status} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 text-sm">
          <span className="text-text-muted">制限:</span>
          <div className="flex flex-wrap gap-1.5">
            {restrictionNames(customerRestrictions, allTags).map((name) => (
              <span
                key={name}
                className="px-2 py-0.5 bg-ng-bg text-ng border border-ng-border rounded text-xs font-semibold"
              >
                {name}
              </span>
            ))}
          </div>
          <span className="text-text-muted ml-2">条件: {customer?.condition ?? "—"}</span>
          <span className="text-text-muted">コンタミ: {customer?.contamination ?? "—"}</span>
        </div>
      </div>

      {/* サマリーチップ（クリックでフィルタ） */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        {(
          [
            {
              key: "all",
              label: "すべて",
              count: dishResults.length,
              style: "bg-bg-cream border-border text-text-secondary",
            },
            {
              key: "NG",
              label: "NG",
              count: counts.NG,
              style: "bg-ng-bg border-ng-border text-ng",
            },
            {
              key: "要確認",
              label: "要確認",
              count: counts.要確認,
              style: "bg-caution-bg border-caution-border text-caution",
            },
            {
              key: "OK",
              label: "OK",
              count: counts.OK,
              style: "bg-ok-bg border-ok-border text-ok",
            },
            {
              key: "legal_only",
              label: "法的のみ",
              count: legalOnlyCount,
              style: "bg-[#fef3c7] border-[#fcd34d] text-[#92400e]",
            },
          ] as const
        ).map(({ key, label, count, style }) => (
          <button
            key={key}
            onClick={() => setJudgmentFilter(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${style} ${
              judgmentFilter === key
                ? "ring-2 ring-primary/40 shadow-card"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            {label} <span className="text-lg">{count}</span>件
          </button>
        ))}
      </div>

      {/* アクションボタン */}
      <div className="flex flex-wrap gap-2">
        {assignment.status === "未確認" && (
          <button
            onClick={() => updateStatus("確認済")}
            className="px-4 py-2 text-sm bg-ok text-white rounded-lg hover:opacity-90 transition-colors cursor-pointer"
          >
            確認済にする
          </button>
        )}
        {(assignment.status === "未確認" || assignment.status === "確認済") && (
          <button
            onClick={() => updateStatus("厨房共有済")}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors cursor-pointer"
          >
            厨房共有
          </button>
        )}
      </div>

      {/* 除外された料理の表示 */}
      {resolvedDishes.some((d) => d.isRemoved) && (
        <div className="bg-bg-cream border border-border-light rounded-xl p-4">
          <p className="text-sm text-text-muted mb-2">除外された料理:</p>
          <div className="flex flex-wrap gap-2">
            {resolvedDishes
              .filter((d) => d.isRemoved)
              .map((d) => {
                const origId = d.customization?.originalDishId ?? d.recipe.id;
                return (
                  <span
                    key={d.recipe.id}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-bg-card border border-border rounded-lg text-sm text-text-secondary"
                  >
                    <span className="line-through">{d.recipe.name}</span>
                    <button
                      onClick={() => updateCustomization(origId, { action: undefined })}
                      className="text-primary hover:text-primary-light text-xs cursor-pointer"
                    >
                      戻す
                    </button>
                  </span>
                );
              })}
          </div>
        </div>
      )}

      {/* 料理別アコーディオン */}
      <div className="space-y-3">
        {filteredDishResults.map(
          ({
            recipe,
            judgment,
            matchedReasons,
            isCustomized,
            customization,
            excludedIngredientIds,
          }) => {
            const originalDishId = customization?.originalDishId ?? recipe.id;
            const isReplaced = customization?.action === "replace";
            const isModifiedAction = customization?.action === "modify";
            // resolve the actual dish for ingredient display
            // For "replace", the recipe is already the replacement from resolveCustomizedDishes
            // For "modify", we need the original dish to get linkedIngredients
            const originalDish = allRecipes.find((r) => r.id === originalDishId);
            const ingredientSourceDish = isReplaced ? recipe : (originalDish ?? recipe);

            return (
              <DishAccordion
                key={`${recipe.id}-${originalDishId}`}
                dish={ingredientSourceDish}
                judgment={judgment}
                matchedReasons={matchedReasons}
                isOpen={expanded.has(originalDishId)}
                onToggle={() => toggle(originalDishId)}
                customerRestrictions={customerRestrictions}
                customizationBadge={
                  isCustomized && customization?.action
                    ? (customizationLabel(customization.action) ?? undefined)
                    : undefined
                }
                onRemoveDish={() => handleRemoveDish(originalDishId)}
                onOpenReplaceModal={() => openReplaceModal(originalDishId)}
                onClearReplace={() => handleClearReplace(originalDishId)}
                isReplaced={isReplaced}
                originalDishName={isReplaced ? originalDish?.name : undefined}
                isModified={isModifiedAction}
                excludedIngredientIds={new Set(excludedIngredientIds)}
                onToggleIngredientExclude={(ingredientId) =>
                  handleToggleIngredientExclude(originalDishId, ingredientId)
                }
                onInlineIngredientRename={(ingIdx, newName) =>
                  handleInlineIngredientRename(originalDishId, ingIdx, newName)
                }
                allIngredientNames={allIngredientNames}
                customIngredients={customization?.customIngredients}
                cookingStateOverrides={customization?.cookingStateOverrides ?? {}}
                onCookingStateChange={(ingredientId, state) =>
                  handleCookingStateChange(originalDishId, ingredientId, state)
                }
                note={customization?.note ?? ""}
                onNoteChange={(note) => updateCustomization(originalDishId, { note })}
                isRemoved={false}
              />
            );
          },
        )}
      </div>

      {/* 厨房メモ（全体） */}
      <div className="bg-bg-card border border-border rounded-xl p-5 shadow-card">
        <label className="block">
          <span className="text-sm font-medium text-text-secondary mb-2 block">
            厨房メモ（全体）
          </span>
          <textarea
            value={assignment.kitchenNote}
            onChange={(e) => updateKitchenNote(e.target.value)}
            placeholder="厨房への全体的な指示・メモ"
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-card focus:border-primary/50 focus:shadow-card outline-none resize-none"
          />
        </label>
      </div>

      {/* 差し替えモーダル */}
      <Modal
        open={replaceModalDishId != null}
        onClose={cancelReplaceModal}
        title="料理の差し替え"
        allowOverflow
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-muted mb-2">差し替え先レシピ:</p>
            <SearchableSelect
              options={recipeOptions.filter((r) => r.value !== replaceModalDishId)}
              value={replaceModalRecipeId}
              onChange={(v) => setReplaceModalRecipeId(v as number)}
            />
          </div>
          <div>
            <p className="text-sm text-text-muted mb-2">メモ（厨房向け）:</p>
            <input
              type="text"
              value={replaceModalNote}
              onChange={(e) => setReplaceModalNote(e.target.value)}
              placeholder="例: アレルギー対応のため差し替え"
              className="w-full px-3 py-1.5 border border-border rounded-lg text-sm bg-bg-card focus:border-primary/50 focus:shadow-card outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={cancelReplaceModal}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-cream/50 transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              onClick={saveReplaceModal}
              disabled={replaceModalRecipeId === 0}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
