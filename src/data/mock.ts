export type {
  ImportStatus,
  FileType,
  AllergenAttr,
  NormStatus,
  Judgment,
  ApprovalStatus,
  TaskStatus,
  IngredientCategory,
  ImportQueueItem,
  Ingredient,
  Recipe,
  Customer,
  Course,
  RawMaterial,
  ImportedIngredient,
  AssignmentStatus,
  CustomIngredient,
  DishCustomization,
  CustomerCourseAssignment,
} from "./types";

import type {
  ImportQueueItem,
  Ingredient,
  Recipe,
  Customer,
  Course,
  ImportedIngredient,
  TagAttachment,
  CustomerRestriction,
} from "./types";
import { findTagByName } from "./tags";

/** タグIDからTagAttachmentを生成するヘルパー（モックデータ生成用） */
export function tagById(tagId: string, confirmed = true): TagAttachment {
  return { tagId, source: "manual" as const, confirmed };
}

/** アレルゲン名からTagAttachmentを生成するヘルパー（モックデータ生成用） */
export function allergenToTag(name: string, confirmed: boolean): TagAttachment {
  const tag = findTagByName(name);
  return {
    tagId: tag?.id ?? `unknown.${name}`,
    source: "master" as const,
    confirmed,
  };
}

/** アレルゲン名からCustomerRestrictionを生成するヘルパー（モックデータ生成用） */
export function allergenToRestriction(name: string): CustomerRestriction {
  const tag = findTagByName(name);
  return {
    tagId: tag?.id ?? `unknown.${name}`,
    source: "self_report" as const,
  };
}

// ─── Mock Data ───

export const importQueue: ImportQueueItem[] = [
  {
    id: 101,
    fileName: "soy_sauce_spec.pdf",
    fileType: "規格書",
    extractedCount: 24,
    status: "抽出済み",
  },
  {
    id: 102,
    fileName: "label_aji_miso.jpg",
    fileType: "ラベル",
    extractedCount: 18,
    status: "OCR中",
  },
  {
    id: 104,
    fileName: "dashi_components.xlsx",
    fileType: "Excel",
    extractedCount: 0,
    status: "エラー",
  },
];

// ─── 仕入れ食材（正規化確認用） ───

export const importedIngredients: ImportedIngredient[] = [
  {
    id: 1,
    sourceFile: "soy_sauce_spec.pdf",
    name: "醤油（丸大豆）",
    rawMaterials: [
      { name: "大豆", allergens: ["大豆"] },
      { name: "小麦", allergens: ["小麦"] },
      { name: "食塩", allergens: [] },
      { name: "アルコール", allergens: [] },
    ],
    status: "確定",
  },
  {
    id: 2,
    sourceFile: "soy_sauce_spec.pdf",
    name: "白味噌",
    rawMaterials: [
      { name: "大豆", allergens: ["大豆"] },
      { name: "米", allergens: [] },
      { name: "食塩", allergens: [] },
    ],
    status: "確定",
  },
  {
    id: 3,
    sourceFile: "label_aji_miso.jpg",
    name: "みりん風調味料",
    rawMaterials: [
      { name: "水飴", allergens: [] },
      { name: "醸造酢", allergens: [] },
      { name: "米", allergens: [] },
      { name: "アルコール", allergens: [] },
    ],
    status: "要確認",
  },
  {
    id: 4,
    sourceFile: "ingredients_2026_02.csv",
    name: "天ぷら粉",
    rawMaterials: [
      { name: "小麦粉", allergens: ["小麦"] },
      { name: "でんぷん", allergens: [] },
      { name: "卵白粉", allergens: ["卵"] },
      { name: "ベーキングパウダー", allergens: [] },
    ],
    status: "確定",
  },
  {
    id: 5,
    sourceFile: "label_aji_miso.jpg",
    name: "出汁パック",
    rawMaterials: [
      { name: "かつお節", allergens: [] },
      { name: "昆布", allergens: [] },
      { name: "干し椎茸", allergens: [] },
    ],
    status: "確定",
    tags: [tagById("tex.nebaNeba")],
  },
  {
    id: 6,
    sourceFile: "ingredients_2026_02.csv",
    name: "マヨネーズ",
    rawMaterials: [
      { name: "食用植物油脂（大豆を含む）", allergens: ["大豆"] },
      { name: "卵黄", allergens: ["卵"] },
      { name: "醸造酢", allergens: [] },
      { name: "食塩", allergens: [] },
      { name: "香辛料", allergens: [] },
    ],
    status: "要確認",
  },
  {
    id: 7,
    sourceFile: "dashi_components.xlsx",
    name: "カレールー",
    rawMaterials: [
      { name: "小麦粉", allergens: ["小麦"] },
      { name: "食用油脂（豚脂）", allergens: ["豚肉"] },
      { name: "食塩", allergens: [] },
      { name: "砂糖", allergens: [] },
      { name: "カレー粉", allergens: [] },
      { name: "乳糖", allergens: ["乳"] },
      { name: "脱脂粉乳", allergens: ["乳"] },
    ],
    status: "要確認",
    tags: [tagById("odor.strong")],
  },
  {
    id: 8,
    sourceFile: "dashi_components.xlsx",
    name: "ごま油",
    rawMaterials: [{ name: "ごま", allergens: ["ごま"] }],
    status: "確定",
  },
];

export const availableIngredients: Ingredient[] = [
  {
    id: 1,
    name: "銀鱈",
    category: "主食材",
    tags: [tagById("tax.fish"), tagById("tax.high_mercury_fish")],
  },
  {
    id: 2,
    name: "和牛A5",
    category: "主食材",
    tags: [tagById("tax.meat")],
  },
  {
    id: 3,
    name: "車えび",
    category: "主食材",
    tags: [allergenToTag("えび", true), tagById("tax.crustacean"), tagById("tex.puriPuri")],
  },
  {
    id: 4,
    name: "鯛",
    category: "主食材",
    tags: [tagById("tax.fish"), tagById("odor.fishy")],
  },
  {
    id: 5,
    name: "白味噌",
    category: "調味料",
    tags: [allergenToTag("大豆", true), tagById("odor.strong")],
  },
  { id: 6, name: "みりん", category: "調味料", tags: [tagById("tax.alcohol")] },
  {
    id: 7,
    name: "醤油",
    category: "調味料",
    tags: [allergenToTag("大豆", false), allergenToTag("小麦", false), tagById("odor.strong")],
  },
  { id: 8, name: "料理酒", category: "調味料", tags: [tagById("tax.alcohol")] },
  {
    id: 9,
    name: "基本出汁",
    category: "共通仕込み",
    tags: [tagById("tax.fish"), tagById("odor.fishy")],
  },
  {
    id: 10,
    name: "醤油タレ",
    category: "共通仕込み",
    tags: [allergenToTag("大豆", false), allergenToTag("小麦", false), tagById("odor.strong")],
  },
  {
    id: 11,
    name: "天ぷら衣",
    category: "共通仕込み",
    tags: [allergenToTag("卵", true), allergenToTag("小麦", true)],
  },
  {
    id: 12,
    name: "味噌ダレ",
    category: "共通仕込み",
    tags: [allergenToTag("大豆", true), tagById("odor.strong")],
  },
];

// ─── Recipes ───

/** availableIngredients から ID で Ingredient を取得するヘルパー */
function ing(id: number): Ingredient {
  const found = availableIngredients.find((i) => i.id === id);
  if (!found) throw new Error(`Ingredient ${id} not found`);
  return found;
}

export const recipes: Recipe[] = [
  {
    id: 1,
    name: "銀鱈の西京焼き",
    version: "v2026-02",
    linkedIngredients: [ing(1), ing(5), ing(6), ing(9)],
    ingredientLinks: [
      { ingredientId: 1, cookingState: "cooked" },
      { ingredientId: 5, cookingState: "cooked" },
      { ingredientId: 6, cookingState: "cooked" },
      { ingredientId: 9, cookingState: "cooked" },
    ],
  },
  {
    id: 2,
    name: "先付（季節の前菜）",
    version: "v2026-02",
    linkedIngredients: [ing(4), ing(7), ing(9)],
    ingredientLinks: [
      { ingredientId: 4, cookingState: "raw" },
      { ingredientId: 7, cookingState: "cooked" },
      { ingredientId: 9, cookingState: "cooked" },
    ],
  },
  {
    id: 3,
    name: "天ぷら盛り合わせ",
    version: "v2026-01",
    linkedIngredients: [ing(3), ing(11), ing(8)],
    ingredientLinks: [
      { ingredientId: 3, cookingState: "cooked" },
      { ingredientId: 11, cookingState: "cooked" },
      { ingredientId: 8, cookingState: "cooked" },
    ],
  },
  {
    id: 4,
    name: "和牛すき焼き",
    version: "v2026-02",
    linkedIngredients: [ing(2), ing(7), ing(6), ing(10)],
    ingredientLinks: [
      { ingredientId: 2, cookingState: "semi_raw" },
      { ingredientId: 7, cookingState: "cooked" },
      { ingredientId: 6, cookingState: "cooked" },
      { ingredientId: 10, cookingState: "cooked" },
    ],
  },
  {
    id: 5,
    name: "抹茶プリン",
    version: "v2026-01",
    linkedIngredients: [ing(12)],
    ingredientLinks: [{ ingredientId: 12, cookingState: "cooked" }],
  },
];

// ─── Rooms ───

export const ROOMS = [
  "スタイリッシュスイート",
  "エグゼクティブスタイリッシュスイート",
  "コンフォートスイート",
  "エグゼクティブコンフォートスイート",
  "プレシャスコーナースイート",
  "エグゼクティブプレシャスコーナースイート",
  "ラグジュアリーコーナースイート",
  "エグゼクティブラグジュアリーコーナースイート",
  "プレミアムスイート",
  "エグゼクティブプレミアムスイート",
  "ふふラグジュアリープレミアムスイート",
] as const;

// ─── Customers ───

export const customers: Customer[] = [
  {
    id: 1,
    name: "山田 太郎",
    condition: "微量NG",
    contamination: "不可",
    checkInDate: "2026-02-07",
    roomName: "スタイリッシュスイート",
    notes: "",
    originalText: "",
    restrictions: [allergenToRestriction("卵"), allergenToRestriction("えび")],
    presets: [],
  },
  {
    id: 2,
    name: "佐藤 花子",
    condition: "少量可",
    contamination: "要確認",
    checkInDate: "2026-02-08",
    roomName: "コンフォートスイート",
    notes: "",
    originalText: "",
    restrictions: [allergenToRestriction("小麦"), allergenToRestriction("大豆")],
    presets: [],
  },
  {
    id: 3,
    name: "田中 一郎",
    condition: "微量NG",
    contamination: "不可",
    checkInDate: "2026-02-09",
    roomName: "プレミアムスイート",
    notes: "",
    originalText: "",
    restrictions: [
      allergenToRestriction("乳"),
      allergenToRestriction("落花生"),
      allergenToRestriction("くるみ"),
    ],
    presets: [],
  },
  {
    id: 4,
    name: "鈴木 美咲",
    condition: "条件付き",
    contamination: "要確認",
    checkInDate: "2026-02-10",
    roomName: "ラグジュアリーコーナースイート",
    notes: "妊娠中。ネバネバ系の食感が苦手。",
    originalText: "妊娠8ヶ月です。ネバネバした食感のものは食べられません。",
    restrictions: [
      { tagId: "tex.nebaNeba", source: "self_report" as const },
      { tagId: "risk.listeria", source: "preset" as const },
      { tagId: "risk.toxoplasma", source: "preset" as const },
      { tagId: "risk.mercury", source: "preset" as const },
      { tagId: "risk.caffeine", source: "preset" as const },
      { tagId: "risk.alcohol", source: "preset" as const },
    ],
    presets: ["pregnancy"],
  },
];

// ─── Courses ───

export const courses: Course[] = [
  {
    id: 1,
    name: "2月特別懐石コース",
    dishIds: [2, 1, 3, 4, 5],
  },
  {
    id: 2,
    name: "お祝い会席コース",
    dishIds: [2, 1, 4, 5],
  },
];
