import { useState } from "react";
import { allTags, getTagsByCategory, allPresets } from "../data/tags";
import { TagChip } from "../components/TagChip";
import { useCustomTags, addableCategories } from "../hooks/useCustomTags";
import type { TagCategory } from "../data/types";

/** allergen_mandatory / allergen_recommended はシステム定義のみ（追加不可） */
const readOnlyCategories = new Set<TagCategory>(["allergen_mandatory", "allergen_recommended"]);

const categoryConfig: {
  category: TagCategory;
  label: string;
  description: string;
}[] = [
  {
    category: "allergen_mandatory",
    label: "特定原材料 8品目（義務表示）",
    description: "食品表示法で義務付けられた表示対象品目",
  },
  {
    category: "allergen_recommended",
    label: "準特定原材料 20品目（推奨表示）",
    description: "表示が推奨されている品目",
  },
  {
    category: "taxonomy",
    label: "食材分類タグ",
    description: "食材のグループ分類（甲殻類、ナッツ類、青魚 等）",
  },
  {
    category: "texture",
    label: "食感タグ",
    description: "食材の食感特性（ネバネバ、ぬるぬる 等）",
  },
  {
    category: "odor",
    label: "匂いタグ",
    description: "食材の匂い特性",
  },
  {
    category: "risk",
    label: "健康リスクタグ",
    description: "妊婦等の健康リスク（リステリア、トキソプラズマ 等）",
  },
];

function InlineCategoryAddForm({
  category,
  onAdd,
}: {
  category: TagCategory;
  onAdd: (name: string, category: TagCategory) => { ok: boolean; error?: string };
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const allTagNames = allTags.map((t) => t.name);

  function handleAdd() {
    const trimmed = input.trim();
    if (allTagNames.includes(trimmed)) {
      setError("システム定義タグに含まれています");
      return;
    }
    const result = onAdd(trimmed, category);
    if (result.ok) {
      setInput("");
      setError("");
    } else {
      setError(result.error ?? "");
    }
  }

  return (
    <div className="flex gap-2 items-start mt-3 pt-3 border-t border-border-light">
      <div className="flex-1">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="タグ名を入力して追加"
          className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {error && <p className="text-ng text-xs mt-1">{error}</p>}
      </div>
      <button
        onClick={handleAdd}
        className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors cursor-pointer shrink-0"
      >
        追加
      </button>
    </div>
  );
}

export function CustomAllergenPage() {
  const { add, remove, getByCategory } = useCustomTags();

  const categoryLabel = Object.fromEntries(addableCategories.map((c) => [c.category, c.label]));

  return (
    <div className="space-y-6">
      {/* システム定義タグ一覧 + カスタムタグ追加 */}
      {categoryConfig.map(({ category, label, description }) => {
        const systemTags = getTagsByCategory(category);
        const customItems = getByCategory(category);
        const isReadOnly = readOnlyCategories.has(category);
        if (systemTags.length === 0 && customItems.length === 0 && isReadOnly) return null;
        return (
          <div
            key={category}
            className="bg-bg-card border border-border rounded-xl p-5 shadow-card space-y-3"
          >
            <div>
              <h3 className="font-display text-base font-semibold">{label}</h3>
              <p className="text-xs text-text-muted mt-0.5">{description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {systemTags.map((tag) => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  attachment={{ tagId: tag.id, source: "master", confirmed: true }}
                />
              ))}
              {customItems.map((item) => (
                <span
                  key={`custom-${item.name}`}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-bg-cream border border-border rounded text-[11px] font-semibold"
                >
                  {item.name}
                  <button
                    onClick={() => remove(item.name, item.category)}
                    className="text-text-muted hover:text-ng transition-colors cursor-pointer text-[10px] leading-none"
                    aria-label={`${item.name}を削除`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {!isReadOnly && <InlineCategoryAddForm category={category} onAdd={add} />}
          </div>
        );
      })}

      {/* カスタムアレルゲン（allergen_custom カテゴリ） */}
      {(() => {
        const customAllergens = getByCategory("allergen_custom");
        return (
          <div className="bg-bg-card border border-border rounded-xl p-5 shadow-card space-y-3">
            <div>
              <h3 className="font-display text-base font-semibold">
                {categoryLabel["allergen_custom"] ?? "カスタムアレルゲン"}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">施設固有のアレルゲン（28品目以外）</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {customAllergens.map((item) => (
                <span
                  key={`custom-${item.name}`}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-bg-cream border border-border rounded text-[11px] font-semibold"
                >
                  {item.name}
                  <button
                    onClick={() => remove(item.name, item.category)}
                    className="text-text-muted hover:text-ng transition-colors cursor-pointer text-[10px] leading-none"
                    aria-label={`${item.name}を削除`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {customAllergens.length === 0 && (
                <p className="text-text-muted text-sm">
                  カスタムアレルゲンはまだ登録されていません
                </p>
              )}
            </div>
            <InlineCategoryAddForm category={"allergen_custom"} onAdd={add} />
          </div>
        );
      })()}

      {/* プリセット一覧 */}
      <div className="bg-bg-card border border-border rounded-xl p-5 shadow-card space-y-3">
        <div>
          <h3 className="font-display text-base font-semibold">プリセット</h3>
          <p className="text-xs text-text-muted mt-0.5">顧客属性に応じた制限タグセット</p>
        </div>
        {allPresets.map((preset) => {
          const presetTags = preset.tagIds
            .map((id) => allTags.find((t) => t.id === id))
            .filter((t): t is (typeof allTags)[number] => t != null);
          return (
            <div key={preset.id} className="border border-border-light rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{preset.name}</span>
                <span className="text-[11px] px-1.5 py-0.5 bg-bg-cream border border-border-light rounded text-text-muted">
                  {preset.tagIds.length}タグ
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presetTags.map((tag) => (
                  <TagChip
                    key={tag.id}
                    tag={tag}
                    attachment={{ tagId: tag.id, source: "master", confirmed: true }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
