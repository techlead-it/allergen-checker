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

// ─── Mock Data（如月御献立 / 令和八年二月三日） ───

export const importQueue: ImportQueueItem[] = [
  {
    id: 101,
    fileName: "如月御献立_食材一覧.txt",
    fileType: "CSV",
    extractedCount: 14,
    status: "取込完了",
  },
];

// ─── 仕入れ食材（正規化確認用） ───

export const importedIngredients: ImportedIngredient[] = [
  {
    id: 1,
    sourceFile: "如月御献立_食材一覧.txt",
    name: "醤油",
    rawMaterials: [
      { name: "大豆", allergens: ["大豆"] },
      { name: "小麦", allergens: ["小麦"] },
      { name: "食塩", allergens: [] },
    ],
    status: "確定",
  },
  {
    id: 2,
    sourceFile: "如月御献立_食材一覧.txt",
    name: "薄口醤油",
    rawMaterials: [
      { name: "大豆", allergens: ["大豆"] },
      { name: "小麦", allergens: ["小麦"] },
      { name: "食塩", allergens: [] },
    ],
    status: "確定",
  },
  {
    id: 3,
    sourceFile: "如月御献立_食材一覧.txt",
    name: "味噌",
    rawMaterials: [
      { name: "大豆", allergens: ["大豆"] },
      { name: "米", allergens: [] },
      { name: "食塩", allergens: [] },
    ],
    status: "確定",
  },
  {
    id: 4,
    sourceFile: "如月御献立_食材一覧.txt",
    name: "赤味噌",
    rawMaterials: [
      { name: "大豆", allergens: ["大豆"] },
      { name: "食塩", allergens: [] },
    ],
    status: "確定",
  },
  {
    id: 5,
    sourceFile: "如月御献立_食材一覧.txt",
    name: "ごま油",
    rawMaterials: [{ name: "ごま", allergens: ["ごま"] }],
    status: "確定",
  },
  {
    id: 6,
    sourceFile: "如月御献立_食材一覧.txt",
    name: "きな粉",
    rawMaterials: [{ name: "大豆", allergens: ["大豆"] }],
    status: "確定",
  },
  {
    id: 7,
    sourceFile: "如月御献立_食材一覧.txt",
    name: "白胡麻",
    rawMaterials: [{ name: "ごま", allergens: ["ごま"] }],
    status: "確定",
  },
  {
    id: 8,
    sourceFile: "如月御献立_食材一覧.txt",
    name: "小麦粉",
    rawMaterials: [{ name: "小麦粉", allergens: ["小麦"] }],
    status: "確定",
  },
  {
    id: 9,
    sourceFile: "如月御献立_食材一覧.txt",
    name: "春巻きの皮",
    rawMaterials: [
      { name: "小麦粉", allergens: ["小麦"] },
      { name: "食塩", allergens: [] },
    ],
    status: "確定",
  },
  {
    id: 10,
    sourceFile: "如月御献立_食材一覧.txt",
    name: "造り醤油",
    rawMaterials: [
      { name: "醤油", allergens: ["大豆", "小麦"] },
      { name: "出汁", allergens: [] },
    ],
    status: "確定",
  },
  {
    id: 11,
    sourceFile: "如月御献立_食材一覧.txt",
    name: "納豆醤油",
    rawMaterials: [
      { name: "醤油", allergens: ["大豆", "小麦"] },
      { name: "発酵調味料", allergens: ["大豆"] },
    ],
    status: "確定",
  },
  {
    id: 12,
    sourceFile: "如月御献立_食材一覧.txt",
    name: "莫久来ポン酢",
    rawMaterials: [
      { name: "ナマコ", allergens: [] },
      { name: "このわた", allergens: [] },
      { name: "酢", allergens: [] },
      { name: "醤油", allergens: ["大豆", "小麦"] },
      { name: "柑橘果汁", allergens: [] },
      { name: "出汁", allergens: [] },
    ],
    status: "確定",
  },
  {
    id: 13,
    sourceFile: "如月御献立_食材一覧.txt",
    name: "特製ソース",
    rawMaterials: [
      { name: "醤油", allergens: ["大豆", "小麦"] },
      { name: "みりん", allergens: [] },
      { name: "砂糖", allergens: [] },
      { name: "にんにく", allergens: [] },
      { name: "バター", allergens: ["乳"] },
    ],
    status: "要確認",
  },
  {
    id: 14,
    sourceFile: "如月御献立_食材一覧.txt",
    name: "酢飯",
    rawMaterials: [
      { name: "米", allergens: [] },
      { name: "酢", allergens: [] },
      { name: "砂糖", allergens: [] },
      { name: "塩", allergens: [] },
    ],
    status: "確定",
  },
];

// ─── 食材マスター ───

export const availableIngredients: Ingredient[] = [
  // ── 主食材 ──
  { id: 1, name: "河豚白子", category: "主食材", tags: [tagById("tax.fish")] },
  { id: 2, name: "白菜", category: "主食材", tags: [] },
  { id: 3, name: "浜防風", category: "主食材", tags: [] },
  { id: 4, name: "合鴨", category: "主食材", tags: [tagById("tax.meat")] },
  { id: 5, name: "独活", category: "主食材", tags: [] },
  { id: 6, name: "金柑", category: "主食材", tags: [] },
  { id: 7, name: "飯蛸", category: "主食材", tags: [] },
  { id: 8, name: "菜の花", category: "主食材", tags: [] },
  { id: 9, name: "うるい", category: "主食材", tags: [] },
  { id: 10, name: "こごみ", category: "主食材", tags: [] },
  { id: 11, name: "海鼠", category: "主食材", tags: [] },
  { id: 12, name: "長芋", category: "主食材", tags: [allergenToTag("やまいも", true)] },
  {
    id: 13,
    name: "桜海老",
    category: "主食材",
    tags: [allergenToTag("えび", true), tagById("tax.crustacean")],
  },
  {
    id: 14,
    name: "チーズ",
    category: "主食材",
    tags: [allergenToTag("乳", true), tagById("tax.cheese")],
  },
  { id: 15, name: "河豚", category: "主食材", tags: [tagById("tax.fish")] },
  { id: 16, name: "蕗の薹", category: "主食材", tags: [] },
  { id: 17, name: "ひろっこ", category: "主食材", tags: [] },
  { id: 18, name: "たらの芽", category: "主食材", tags: [] },
  { id: 19, name: "スルメ", category: "主食材", tags: [allergenToTag("いか", true)] },
  { id: 20, name: "人参", category: "主食材", tags: [] },
  { id: 21, name: "木の芽", category: "主食材", tags: [] },
  { id: 22, name: "鮃", category: "主食材", tags: [tagById("tax.fish")] },
  {
    id: 23,
    name: "甘海老",
    category: "主食材",
    tags: [allergenToTag("えび", true), tagById("tax.crustacean")],
  },
  {
    id: 24,
    name: "マグロ",
    category: "主食材",
    tags: [tagById("tax.fish"), tagById("tax.high_mercury_fish")],
  },
  { id: 25, name: "辛味大根", category: "主食材", tags: [] },
  { id: 26, name: "鮟鱇", category: "主食材", tags: [tagById("tax.fish")] },
  { id: 27, name: "豆腐", category: "主食材", tags: [allergenToTag("大豆", true)] },
  { id: 28, name: "大根", category: "主食材", tags: [] },
  { id: 29, name: "蒟蒻", category: "主食材", tags: [] },
  { id: 30, name: "芹", category: "主食材", tags: [] },
  { id: 31, name: "笹葱", category: "主食材", tags: [] },
  {
    id: 32,
    name: "黒毛和牛",
    category: "主食材",
    tags: [allergenToTag("牛肉", true), tagById("tax.meat")],
  },
  { id: 33, name: "白魚", category: "主食材", tags: [tagById("tax.fish")] },
  { id: 34, name: "百合根", category: "主食材", tags: [] },
  { id: 35, name: "葉牛蒡", category: "主食材", tags: [] },
  { id: 36, name: "赤柴漬け", category: "主食材", tags: [] },
  { id: 37, name: "苺", category: "主食材", tags: [] },
  { id: 38, name: "デコポン", category: "主食材", tags: [] },
  { id: 39, name: "わらび粉", category: "主食材", tags: [] },
  {
    id: 40,
    name: "海老",
    category: "主食材",
    tags: [allergenToTag("えび", true), tagById("tax.crustacean")],
  },
  { id: 41, name: "白身魚すり身", category: "主食材", tags: [tagById("tax.fish")] },
  { id: 42, name: "桜葉", category: "主食材", tags: [] },
  { id: 43, name: "柚子", category: "主食材", tags: [] },
  { id: 44, name: "米", category: "主食材", tags: [] },
  { id: 45, name: "春巻きの皮", category: "主食材", tags: [allergenToTag("小麦", true)] },
  { id: 46, name: "鰹節", category: "主食材", tags: [tagById("tax.fish")] },
  { id: 47, name: "山芋", category: "主食材", tags: [allergenToTag("やまいも", true)] },
  { id: 48, name: "胡瓜", category: "主食材", tags: [] },
  { id: 49, name: "茄子", category: "主食材", tags: [] },

  // ── 調味料 ──
  { id: 51, name: "塩", category: "調味料", tags: [] },
  { id: 52, name: "酒", category: "調味料", tags: [tagById("tax.alcohol")] },
  { id: 53, name: "黒七味", category: "調味料", tags: [] },
  {
    id: 54,
    name: "醤油",
    category: "調味料",
    tags: [allergenToTag("大豆", false), allergenToTag("小麦", false)],
  },
  {
    id: 55,
    name: "薄口醤油",
    category: "調味料",
    tags: [allergenToTag("大豆", false), allergenToTag("小麦", false)],
  },
  { id: 56, name: "みりん", category: "調味料", tags: [tagById("tax.alcohol")] },
  { id: 57, name: "砂糖", category: "調味料", tags: [] },
  { id: 58, name: "ごま油", category: "調味料", tags: [allergenToTag("ごま", true)] },
  { id: 59, name: "酢", category: "調味料", tags: [] },
  { id: 60, name: "からし", category: "調味料", tags: [] },
  { id: 61, name: "味噌", category: "調味料", tags: [allergenToTag("大豆", true)] },
  { id: 62, name: "胡椒", category: "調味料", tags: [] },
  { id: 63, name: "七味", category: "調味料", tags: [] },
  { id: 64, name: "辛子", category: "調味料", tags: [] },
  { id: 65, name: "山葵", category: "調味料", tags: [] },
  { id: 66, name: "にんにく", category: "調味料", tags: [] },
  { id: 67, name: "白胡麻", category: "調味料", tags: [allergenToTag("ごま", true)] },
  { id: 68, name: "きな粉", category: "調味料", tags: [allergenToTag("大豆", true)] },
  { id: 69, name: "小麦粉", category: "調味料", tags: [allergenToTag("小麦", true)] },
  { id: 70, name: "卵", category: "調味料", tags: [allergenToTag("卵", true)] },
  { id: 71, name: "片栗粉", category: "調味料", tags: [] },

  // ── 共通仕込み ──
  { id: 81, name: "出汁（昆布・鰹）", category: "共通仕込み", tags: [] },
  { id: 82, name: "酢飯", category: "共通仕込み", tags: [] },
  {
    id: 83,
    name: "造り醤油",
    category: "共通仕込み",
    tags: [allergenToTag("大豆", false), allergenToTag("小麦", false)],
  },
  {
    id: 84,
    name: "納豆醤油",
    category: "共通仕込み",
    tags: [allergenToTag("大豆", true), allergenToTag("小麦", false)],
  },
  {
    id: 85,
    name: "莫久来ポン酢",
    category: "共通仕込み",
    tags: [allergenToTag("大豆", false)],
  },
  {
    id: 86,
    name: "特製ソース",
    category: "共通仕込み",
    tags: [allergenToTag("大豆", false), allergenToTag("小麦", false), allergenToTag("乳", false)],
  },
  {
    id: 87,
    name: "赤味噌",
    category: "共通仕込み",
    tags: [allergenToTag("大豆", true)],
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
    name: "先付 河豚白子",
    version: "v2026-02",
    linkedIngredients: [
      ing(1),
      ing(2),
      ing(3),
      ing(43),
      ing(51),
      ing(52),
      ing(53),
      ing(55),
      ing(81),
    ],
    ingredientLinks: [
      { ingredientId: 1, cookingState: "cooked" },
      { ingredientId: 2, cookingState: "cooked" },
      { ingredientId: 3, cookingState: "cooked" },
      { ingredientId: 43, cookingState: "cooked" },
      { ingredientId: 51, cookingState: "cooked" },
      { ingredientId: 52, cookingState: "cooked" },
      { ingredientId: 53, cookingState: "cooked" },
      { ingredientId: 55, cookingState: "cooked" },
      { ingredientId: 81, cookingState: "cooked" },
    ],
  },
  {
    id: 2,
    name: "合鴨塩蒸し 独活金平 金柑ソース",
    version: "v2026-02",
    linkedIngredients: [
      ing(4),
      ing(5),
      ing(20),
      ing(6),
      ing(51),
      ing(52),
      ing(54),
      ing(56),
      ing(57),
      ing(58),
      ing(59),
    ],
    ingredientLinks: [
      { ingredientId: 4, cookingState: "cooked" },
      { ingredientId: 5, cookingState: "cooked" },
      { ingredientId: 20, cookingState: "cooked" },
      { ingredientId: 6, cookingState: "cooked" },
      { ingredientId: 51, cookingState: "cooked" },
      { ingredientId: 52, cookingState: "cooked" },
      { ingredientId: 54, cookingState: "cooked" },
      { ingredientId: 56, cookingState: "cooked" },
      { ingredientId: 57, cookingState: "cooked" },
      { ingredientId: 58, cookingState: "cooked" },
      { ingredientId: 59, cookingState: "cooked" },
    ],
  },
  {
    id: 3,
    name: "飯蛸 菜の花",
    version: "v2026-02",
    linkedIngredients: [ing(7), ing(8), ing(81), ing(54), ing(56), ing(60)],
    ingredientLinks: [
      { ingredientId: 7, cookingState: "cooked" },
      { ingredientId: 8, cookingState: "cooked" },
      { ingredientId: 81, cookingState: "cooked" },
      { ingredientId: 54, cookingState: "cooked" },
      { ingredientId: 56, cookingState: "cooked" },
      { ingredientId: 60, cookingState: "cooked" },
    ],
  },
  {
    id: 4,
    name: "山菜浸し（うるい・こごみ）",
    version: "v2026-02",
    linkedIngredients: [ing(9), ing(10), ing(81), ing(54), ing(56), ing(46)],
    ingredientLinks: [
      { ingredientId: 9, cookingState: "cooked" },
      { ingredientId: 10, cookingState: "cooked" },
      { ingredientId: 81, cookingState: "cooked" },
      { ingredientId: 54, cookingState: "cooked" },
      { ingredientId: 56, cookingState: "cooked" },
      { ingredientId: 46, cookingState: "cooked" },
    ],
  },
  {
    id: 5,
    name: "海鼠酢 落とし芋 柚子",
    version: "v2026-02",
    linkedIngredients: [ing(11), ing(12), ing(43), ing(59), ing(54), ing(57)],
    ingredientLinks: [
      { ingredientId: 11, cookingState: "raw" },
      { ingredientId: 12, cookingState: "raw" },
      { ingredientId: 43, cookingState: "cooked" },
      { ingredientId: 59, cookingState: "cooked" },
      { ingredientId: 54, cookingState: "cooked" },
      { ingredientId: 57, cookingState: "cooked" },
    ],
  },
  {
    id: 6,
    name: "桜海老とチーズの春巻き",
    version: "v2026-02",
    linkedIngredients: [ing(13), ing(14), ing(45), ing(51), ing(62)],
    ingredientLinks: [
      { ingredientId: 13, cookingState: "cooked" },
      { ingredientId: 14, cookingState: "cooked" },
      { ingredientId: 45, cookingState: "cooked" },
      { ingredientId: 51, cookingState: "cooked" },
      { ingredientId: 62, cookingState: "cooked" },
    ],
  },
  {
    id: 7,
    name: "海老真丈の花見揚げ",
    version: "v2026-02",
    linkedIngredients: [ing(40), ing(41), ing(70), ing(47), ing(42), ing(51), ing(52), ing(71)],
    ingredientLinks: [
      { ingredientId: 40, cookingState: "cooked" },
      { ingredientId: 41, cookingState: "cooked" },
      { ingredientId: 70, cookingState: "cooked" },
      { ingredientId: 47, cookingState: "cooked" },
      { ingredientId: 42, cookingState: "cooked" },
      { ingredientId: 51, cookingState: "cooked" },
      { ingredientId: 52, cookingState: "cooked" },
      { ingredientId: 71, cookingState: "cooked" },
    ],
  },
  {
    id: 8,
    name: "河豚握り寿司",
    version: "v2026-02",
    linkedIngredients: [ing(15), ing(82), ing(54), ing(65)],
    ingredientLinks: [
      { ingredientId: 15, cookingState: "raw" },
      { ingredientId: 82, cookingState: "cooked" },
      { ingredientId: 54, cookingState: "cooked" },
      { ingredientId: 65, cookingState: "cooked" },
    ],
  },
  {
    id: 9,
    name: "蕗の薹田楽",
    version: "v2026-02",
    linkedIngredients: [ing(16), ing(61), ing(57), ing(56), ing(52)],
    ingredientLinks: [
      { ingredientId: 16, cookingState: "cooked" },
      { ingredientId: 61, cookingState: "cooked" },
      { ingredientId: 57, cookingState: "cooked" },
      { ingredientId: 56, cookingState: "cooked" },
      { ingredientId: 52, cookingState: "cooked" },
    ],
  },
  {
    id: 10,
    name: "ひろっこ たらの芽 揚げスルメ",
    version: "v2026-02",
    linkedIngredients: [ing(17), ing(18), ing(19), ing(69), ing(51)],
    ingredientLinks: [
      { ingredientId: 17, cookingState: "cooked" },
      { ingredientId: 18, cookingState: "cooked" },
      { ingredientId: 19, cookingState: "cooked" },
      { ingredientId: 69, cookingState: "cooked" },
      { ingredientId: 51, cookingState: "cooked" },
    ],
  },
  {
    id: 11,
    name: "椀盛 すまし仕立て",
    version: "v2026-02",
    linkedIngredients: [ing(20), ing(21), ing(81), ing(55), ing(51)],
    ingredientLinks: [
      { ingredientId: 20, cookingState: "cooked" },
      { ingredientId: 21, cookingState: "cooked" },
      { ingredientId: 81, cookingState: "cooked" },
      { ingredientId: 55, cookingState: "cooked" },
      { ingredientId: 51, cookingState: "cooked" },
    ],
  },
  {
    id: 12,
    name: "造り（鮃・甘海老・中トロ・赤身）",
    version: "v2026-02",
    linkedIngredients: [ing(22), ing(23), ing(24), ing(25), ing(65), ing(83), ing(84), ing(85)],
    ingredientLinks: [
      { ingredientId: 22, cookingState: "raw" },
      { ingredientId: 23, cookingState: "raw" },
      { ingredientId: 24, cookingState: "raw" },
      { ingredientId: 25, cookingState: "raw" },
      { ingredientId: 65, cookingState: "cooked" },
      { ingredientId: 83, cookingState: "cooked" },
      { ingredientId: 84, cookingState: "cooked" },
      { ingredientId: 85, cookingState: "cooked" },
    ],
  },
  {
    id: 13,
    name: "季養鍋 鮟鱇小鍋仕立て",
    version: "v2026-02",
    linkedIngredients: [
      ing(26),
      ing(27),
      ing(28),
      ing(20),
      ing(29),
      ing(30),
      ing(31),
      ing(81),
      ing(54),
      ing(61),
      ing(52),
      ing(43),
      ing(63),
      ing(64),
    ],
    ingredientLinks: [
      { ingredientId: 26, cookingState: "cooked" },
      { ingredientId: 27, cookingState: "cooked" },
      { ingredientId: 28, cookingState: "cooked" },
      { ingredientId: 20, cookingState: "cooked" },
      { ingredientId: 29, cookingState: "cooked" },
      { ingredientId: 30, cookingState: "cooked" },
      { ingredientId: 31, cookingState: "cooked" },
      { ingredientId: 81, cookingState: "cooked" },
      { ingredientId: 54, cookingState: "cooked" },
      { ingredientId: 61, cookingState: "cooked" },
      { ingredientId: 52, cookingState: "cooked" },
      { ingredientId: 43, cookingState: "cooked" },
      { ingredientId: 63, cookingState: "cooked" },
      { ingredientId: 64, cookingState: "cooked" },
    ],
  },
  {
    id: 14,
    name: "焼肴 黒毛和牛炭火焼き",
    version: "v2026-02",
    linkedIngredients: [ing(32), ing(51), ing(65), ing(86)],
    ingredientLinks: [
      { ingredientId: 32, cookingState: "cooked" },
      { ingredientId: 51, cookingState: "cooked" },
      { ingredientId: 65, cookingState: "cooked" },
      { ingredientId: 86, cookingState: "cooked" },
    ],
  },
  {
    id: 15,
    name: "白魚天釜炊き御飯",
    version: "v2026-02",
    linkedIngredients: [ing(44), ing(33), ing(81), ing(54), ing(51), ing(69), ing(70)],
    ingredientLinks: [
      { ingredientId: 44, cookingState: "cooked" },
      { ingredientId: 33, cookingState: "cooked" },
      { ingredientId: 81, cookingState: "cooked" },
      { ingredientId: 54, cookingState: "cooked" },
      { ingredientId: 51, cookingState: "cooked" },
      { ingredientId: 69, cookingState: "cooked" },
      { ingredientId: 70, cookingState: "cooked" },
    ],
  },
  {
    id: 16,
    name: "留椀（赤出汁）",
    version: "v2026-02",
    linkedIngredients: [ing(87), ing(81), ing(27)],
    ingredientLinks: [
      { ingredientId: 87, cookingState: "cooked" },
      { ingredientId: 81, cookingState: "cooked" },
      { ingredientId: 27, cookingState: "cooked" },
    ],
  },
  {
    id: 17,
    name: "香の物 盛り合わせ",
    version: "v2026-02",
    linkedIngredients: [ing(28), ing(48), ing(49), ing(51), ing(59)],
    ingredientLinks: [
      { ingredientId: 28, cookingState: "cooked" },
      { ingredientId: 48, cookingState: "cooked" },
      { ingredientId: 49, cookingState: "cooked" },
      { ingredientId: 51, cookingState: "cooked" },
      { ingredientId: 59, cookingState: "cooked" },
    ],
  },
  {
    id: 18,
    name: "盛り合わせ（百合根・葉牛蒡・赤柴・白胡麻）",
    version: "v2026-02",
    linkedIngredients: [ing(34), ing(35), ing(36), ing(67), ing(81), ing(54), ing(56)],
    ingredientLinks: [
      { ingredientId: 34, cookingState: "cooked" },
      { ingredientId: 35, cookingState: "cooked" },
      { ingredientId: 36, cookingState: "cooked" },
      { ingredientId: 67, cookingState: "cooked" },
      { ingredientId: 81, cookingState: "cooked" },
      { ingredientId: 54, cookingState: "cooked" },
      { ingredientId: 56, cookingState: "cooked" },
    ],
  },
  {
    id: 19,
    name: "わらび餅",
    version: "v2026-02",
    linkedIngredients: [ing(39), ing(57), ing(68)],
    ingredientLinks: [
      { ingredientId: 39, cookingState: "cooked" },
      { ingredientId: 57, cookingState: "cooked" },
      { ingredientId: 68, cookingState: "cooked" },
    ],
  },
  {
    id: 20,
    name: "苺 デコポン あっさり氷菓",
    version: "v2026-02",
    linkedIngredients: [ing(37), ing(38), ing(57)],
    ingredientLinks: [
      { ingredientId: 37, cookingState: "raw" },
      { ingredientId: 38, cookingState: "raw" },
      { ingredientId: 57, cookingState: "cooked" },
    ],
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

// ─── Customers（手動登録用に空） ───

export const customers: Customer[] = [];

// ─── Courses ───

export const courses: Course[] = [
  {
    id: 1,
    name: "上段如月御献立",
    dishIds: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  },
  {
    id: 2,
    name: "下段如月御献立",
    dishIds: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  },
];
