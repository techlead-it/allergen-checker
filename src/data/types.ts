// ─── Types ───

export type ImportStatus = "取込完了" | "抽出済み" | "OCR中" | "エラー";
export type FileType = "規格書" | "ラベル" | "CSV" | "Excel";
export type AllergenAttr = "含む" | "含まない" | "不明";
export type NormStatus = "確定" | "要確認";
export type Judgment = "OK" | "要確認" | "NG";
export type ApprovalStatus = "承認済" | "未承認";
export type TaskStatus = "未対応" | "対応中" | "対応済";
export type IngredientCategory = "主食材" | "調味料" | "共通仕込み";

export type ImportQueueItem = {
  id: number;
  fileName: string;
  fileType: FileType;
  extractedCount: number;
  status: ImportStatus;
};

export type NormalizationItem = {
  id: number;
  original: string;
  normalized: string;
  allergen: AllergenAttr;
  status: NormStatus;
  sourceFile: string;
};

// ─── 仕入れ食材の原材料・アレルゲン管理 ───

export type RawMaterial = {
  name: string;
  allergens: string[];
};

export type ImportedIngredient = {
  id: number;
  sourceFile: string;
  name: string;
  rawMaterials: RawMaterial[];
  status: NormStatus;
  tags?: TagAttachment[];
};

export type Ingredient = {
  id: number;
  name: string;
  category: IngredientCategory;
  tags: TagAttachment[];
};

export type Recipe = {
  id: number;
  name: string;
  version: string;
  linkedIngredients: Ingredient[];
  ingredientLinks: RecipeIngredientLink[];
};

export type Customer = {
  id: number;
  name: string;
  condition: string;
  contamination: string;
  checkInDate: string;
  roomName: string;
  notes: string;
  originalText: string;
  restrictions: CustomerRestriction[];
  presets: string[];
};

export type Course = {
  id: number;
  name: string;
  dishIds: number[];
};

// ─── 統一タグモデル ───

/** タグのカテゴリ */
export type TagCategory =
  | "allergen_mandatory" // 特定原材料8品目（法的表示義務）
  | "allergen_recommended" // 準特定原材料20品目（推奨表示）
  | "allergen_custom" // 施設独自アレルゲン
  | "taxonomy" // 食材分類（甲殻類、青魚、ナッツ類）
  | "texture" // 食感・性質（ネバネバ、ぬるぬる）
  | "odor" // 匂い（においが強い）
  | "risk"; // 健康リスク（高水銀、リステリアリスク）

/** タグの表示優先度 */
export type DisplayPriority = "critical" | "high" | "normal";

/** タグ定義（マスタデータ） */
export type Tag = {
  id: string;
  name: string;
  category: TagCategory;
  displayPriority: DisplayPriority;
  parentTagId?: string;
  synonyms: string[];
  isSystemDefined: boolean;
};

/** 食材に付与されたタグ */
export type TagAttachment = {
  tagId: string;
  source: "ai" | "manual" | "master";
  confirmed: boolean;
  evidence?: string;
};

/** 調理状態 */
export type CookingState = "raw" | "cooked" | "semi_raw";

/** レシピと食材の紐づけ */
export type RecipeIngredientLink = {
  ingredientId: number;
  cookingState: CookingState;
};

/** 顧客の制限条件 */
export type CustomerRestriction = {
  tagId: string;
  source: "self_report" | "medical" | "preset";
  note?: string;
};

/** プリセット（妊婦、乳幼児等） */
export type RestrictionPreset = {
  id: string;
  name: string;
  tagIds: string[];
  isEditable: boolean;
};

/** 調理状態から導出されるルール */
export type CookingStateRule = {
  condition: {
    cookingState: CookingState;
    requiresTag?: string;
  };
  derivedTagId: string;
  description: string;
};

// ─── 割当・カスタマイズ ───

export type AssignmentStatus = "未確認" | "確認済" | "厨房共有済";

export type CustomIngredient = {
  name: string;
  isModified: boolean;
};

export type DishCustomization = {
  originalDishId: number;
  action?: "replace" | "modify" | "remove";
  replacementDishId?: number;
  customIngredients?: CustomIngredient[];
  excludedIngredientIds?: number[];
  cookingStateOverrides?: Record<number, CookingState>;
  note: string;
};

export type CustomerCourseAssignment = {
  id: number;
  customerId: number;
  courseId: number;
  date: string;
  customizations: DishCustomization[];
  kitchenNote: string;
  status: AssignmentStatus;
};
