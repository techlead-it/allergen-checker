import type { ImportedIngredient, RawMaterial, TagAttachment } from "./types";
import { findTagByName } from "./tags";

type IngredientTemplate = {
  name: string;
  rawMaterials: RawMaterial[];
  tags?: TagAttachment[];
};

const ingredientPool: IngredientTemplate[] = [
  {
    name: "バター",
    rawMaterials: [{ name: "生乳", allergens: ["乳"] }],
  },
  {
    name: "ポン酢",
    rawMaterials: [
      { name: "醤油（大豆・小麦を含む）", allergens: ["大豆", "小麦"] },
      { name: "柑橘果汁", allergens: [] },
      { name: "醸造酢", allergens: [] },
    ],
  },
  {
    name: "生クリーム",
    rawMaterials: [
      { name: "クリーム（乳製品）", allergens: ["乳"] },
      { name: "乳化剤", allergens: [] },
    ],
  },
  {
    name: "パン粉",
    rawMaterials: [
      { name: "小麦粉", allergens: ["小麦"] },
      { name: "ショートニング", allergens: [] },
      { name: "イースト", allergens: [] },
      { name: "食塩", allergens: [] },
    ],
  },
  {
    name: "ピーナッツバター",
    rawMaterials: [
      { name: "落花生", allergens: ["落花生"] },
      { name: "植物油", allergens: [] },
      { name: "砂糖", allergens: [] },
    ],
  },
  {
    name: "練りごまペースト",
    rawMaterials: [{ name: "ごま", allergens: ["ごま"] }],
  },
  {
    name: "ウスターソース",
    rawMaterials: [
      { name: "醸造酢", allergens: [] },
      { name: "砂糖", allergens: [] },
      { name: "食塩", allergens: [] },
      { name: "たまねぎ", allergens: [] },
      { name: "りんご", allergens: ["りんご"] },
    ],
  },
  {
    name: "チーズ（ゴーダ）",
    rawMaterials: [
      { name: "生乳", allergens: ["乳"] },
      { name: "食塩", allergens: [] },
    ],
  },
  {
    name: "かつお節",
    rawMaterials: [{ name: "かつお", allergens: [] }],
  },
  {
    name: "片栗粉",
    rawMaterials: [{ name: "馬鈴薯でんぷん", allergens: [] }],
  },
  {
    name: "卵豆腐",
    rawMaterials: [
      { name: "鶏卵", allergens: ["卵"] },
      { name: "出汁", allergens: [] },
      { name: "食塩", allergens: [] },
    ],
  },
  {
    name: "くるみ味噌",
    rawMaterials: [
      { name: "くるみ", allergens: ["くるみ"] },
      { name: "味噌（大豆を含む）", allergens: ["大豆"] },
      { name: "砂糖", allergens: [] },
    ],
  },
  {
    name: "えびせんべい",
    rawMaterials: [
      { name: "えび", allergens: ["えび"] },
      { name: "でんぷん", allergens: [] },
      { name: "食塩", allergens: [] },
      { name: "小麦粉", allergens: ["小麦"] },
    ],
  },
  {
    name: "そば粉",
    rawMaterials: [{ name: "そば", allergens: ["そば"] }],
  },
  {
    name: "ホワイトソース",
    rawMaterials: [
      { name: "バター（乳製品）", allergens: ["乳"] },
      { name: "小麦粉", allergens: ["小麦"] },
      { name: "牛乳", allergens: ["乳"] },
    ],
  },
  {
    name: "オイスターソース",
    rawMaterials: [
      { name: "牡蠣エキス", allergens: [] },
      { name: "醤油（大豆・小麦を含む）", allergens: ["大豆", "小麦"] },
      { name: "砂糖", allergens: [] },
    ],
  },
  {
    name: "アーモンドプードル",
    rawMaterials: [{ name: "アーモンド", allergens: ["アーモンド"] }],
  },
  {
    name: "かにかま",
    rawMaterials: [
      { name: "魚肉すり身", allergens: [] },
      { name: "かにエキス", allergens: ["かに"] },
      { name: "卵白", allergens: ["卵"] },
      { name: "でんぷん", allergens: [] },
    ],
  },
  {
    name: "豚骨スープの素",
    rawMaterials: [
      { name: "豚骨エキス", allergens: ["豚肉"] },
      { name: "食塩", allergens: [] },
      { name: "醤油（大豆・小麦を含む）", allergens: ["大豆", "小麦"] },
    ],
  },
  {
    name: "抹茶パウダー",
    rawMaterials: [{ name: "緑茶（てん茶）", allergens: [] }],
  },
];

function buildTagsFromMaterials(rawMaterials: RawMaterial[]): TagAttachment[] {
  const allergenNames = [...new Set(rawMaterials.flatMap((m) => m.allergens))];
  const tags: TagAttachment[] = [];
  for (const name of allergenNames) {
    const tag = findTagByName(name);
    if (tag) {
      tags.push({ tagId: tag.id, source: "ai", confirmed: false });
    }
  }
  return tags;
}

/**
 * ファイルからOCR結果をシミュレートしてランダム食材を生成する。
 * @param sourceFile 出典ファイル名
 * @param count 生成件数（1-3件程度）
 */
export function generateRandomIngredients(sourceFile: string, count: number): ImportedIngredient[] {
  const baseId = Date.now();
  const shuffled = [...ingredientPool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((template, index) => ({
    id: baseId + index,
    sourceFile,
    name: template.name,
    rawMaterials: template.rawMaterials,
    status: "要確認" as const,
    tags: buildTagsFromMaterials(template.rawMaterials),
  }));
}
