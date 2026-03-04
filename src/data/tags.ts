import type { Tag, TagCategory, CookingStateRule, RestrictionPreset } from "./types";

// ─── 特定原材料8品目（allergen_mandatory / critical） ───

const mandatoryAllergenTags: Tag[] = [
  {
    id: "allergen.egg",
    name: "卵",
    category: "allergen_mandatory",
    displayPriority: "critical",
    synonyms: ["たまご", "鶏卵", "エッグ"],
    isSystemDefined: true,
  },
  {
    id: "allergen.milk",
    name: "乳",
    category: "allergen_mandatory",
    displayPriority: "critical",
    synonyms: ["牛乳", "ミルク"],
    isSystemDefined: true,
  },
  {
    id: "allergen.wheat",
    name: "小麦",
    category: "allergen_mandatory",
    displayPriority: "critical",
    synonyms: ["こむぎ", "ウィート"],
    isSystemDefined: true,
  },
  {
    id: "allergen.buckwheat",
    name: "そば",
    category: "allergen_mandatory",
    displayPriority: "critical",
    synonyms: ["蕎麦", "ソバ"],
    isSystemDefined: true,
  },
  {
    id: "allergen.peanut",
    name: "落花生",
    category: "allergen_mandatory",
    displayPriority: "critical",
    parentTagId: "tax.nuts",
    synonyms: ["ピーナッツ", "らっかせい"],
    isSystemDefined: true,
  },
  {
    id: "allergen.shrimp",
    name: "えび",
    category: "allergen_mandatory",
    displayPriority: "critical",
    parentTagId: "tax.crustacean",
    synonyms: ["エビ", "海老"],
    isSystemDefined: true,
  },
  {
    id: "allergen.crab",
    name: "かに",
    category: "allergen_mandatory",
    displayPriority: "critical",
    parentTagId: "tax.crustacean",
    synonyms: ["カニ", "蟹"],
    isSystemDefined: true,
  },
  {
    id: "allergen.walnut",
    name: "くるみ",
    category: "allergen_mandatory",
    displayPriority: "critical",
    parentTagId: "tax.nuts",
    synonyms: ["クルミ", "胡桃"],
    isSystemDefined: true,
  },
];

// ─── 準特定原材料20品目（allergen_recommended / high） ───

const recommendedAllergenTags: Tag[] = [
  {
    id: "allergen.abalone",
    name: "あわび",
    category: "allergen_recommended",
    displayPriority: "high",
    parentTagId: "tax.shellfish",
    synonyms: ["アワビ", "鮑"],
    isSystemDefined: true,
  },
  {
    id: "allergen.squid",
    name: "いか",
    category: "allergen_recommended",
    displayPriority: "high",
    parentTagId: "tax.shellfish",
    synonyms: ["イカ", "烏賊"],
    isSystemDefined: true,
  },
  {
    id: "allergen.salmon_roe",
    name: "いくら",
    category: "allergen_recommended",
    displayPriority: "high",
    synonyms: ["イクラ"],
    isSystemDefined: true,
  },
  {
    id: "allergen.orange",
    name: "オレンジ",
    category: "allergen_recommended",
    displayPriority: "high",
    synonyms: ["おれんじ"],
    isSystemDefined: true,
  },
  {
    id: "allergen.cashew",
    name: "カシューナッツ",
    category: "allergen_recommended",
    displayPriority: "high",
    parentTagId: "tax.nuts",
    synonyms: ["カシュー"],
    isSystemDefined: true,
  },
  {
    id: "allergen.kiwi",
    name: "キウイフルーツ",
    category: "allergen_recommended",
    displayPriority: "high",
    synonyms: ["キウイ", "きうい"],
    isSystemDefined: true,
  },
  {
    id: "allergen.beef",
    name: "牛肉",
    category: "allergen_recommended",
    displayPriority: "high",
    parentTagId: "tax.meat",
    synonyms: ["ぎゅうにく", "ビーフ"],
    isSystemDefined: true,
  },
  {
    id: "allergen.sesame",
    name: "ごま",
    category: "allergen_recommended",
    displayPriority: "high",
    synonyms: ["ゴマ", "胡麻"],
    isSystemDefined: true,
  },
  {
    id: "allergen.salmon",
    name: "さけ",
    category: "allergen_recommended",
    displayPriority: "high",
    synonyms: ["サケ", "鮭", "サーモン"],
    isSystemDefined: true,
  },
  {
    id: "allergen.mackerel",
    name: "さば",
    category: "allergen_recommended",
    displayPriority: "high",
    parentTagId: "tax.oily_fish",
    synonyms: ["サバ", "鯖"],
    isSystemDefined: true,
  },
  {
    id: "allergen.soybean",
    name: "大豆",
    category: "allergen_recommended",
    displayPriority: "high",
    synonyms: ["だいず", "ソイ"],
    isSystemDefined: true,
  },
  {
    id: "allergen.chicken",
    name: "鶏肉",
    category: "allergen_recommended",
    displayPriority: "high",
    parentTagId: "tax.meat",
    synonyms: ["とりにく", "チキン"],
    isSystemDefined: true,
  },
  {
    id: "allergen.banana",
    name: "バナナ",
    category: "allergen_recommended",
    displayPriority: "high",
    synonyms: ["ばなな"],
    isSystemDefined: true,
  },
  {
    id: "allergen.pork",
    name: "豚肉",
    category: "allergen_recommended",
    displayPriority: "high",
    parentTagId: "tax.meat",
    synonyms: ["ぶたにく", "ポーク"],
    isSystemDefined: true,
  },
  {
    id: "allergen.matsutake",
    name: "まつたけ",
    category: "allergen_recommended",
    displayPriority: "high",
    synonyms: ["マツタケ", "松茸"],
    isSystemDefined: true,
  },
  {
    id: "allergen.peach",
    name: "もも",
    category: "allergen_recommended",
    displayPriority: "high",
    synonyms: ["モモ", "桃", "ピーチ"],
    isSystemDefined: true,
  },
  {
    id: "allergen.yam",
    name: "やまいも",
    category: "allergen_recommended",
    displayPriority: "high",
    synonyms: ["ヤマイモ", "山芋", "長芋", "ながいも"],
    isSystemDefined: true,
  },
  {
    id: "allergen.apple",
    name: "りんご",
    category: "allergen_recommended",
    displayPriority: "high",
    synonyms: ["リンゴ", "林檎", "アップル"],
    isSystemDefined: true,
  },
  {
    id: "allergen.gelatin",
    name: "ゼラチン",
    category: "allergen_recommended",
    displayPriority: "high",
    synonyms: ["ぜらちん"],
    isSystemDefined: true,
  },
  {
    id: "allergen.almond",
    name: "アーモンド",
    category: "allergen_recommended",
    displayPriority: "high",
    parentTagId: "tax.nuts",
    synonyms: ["あーもんど"],
    isSystemDefined: true,
  },
];

// ─── 食材分類タグ（taxonomy） ───

const taxonomyTags: Tag[] = [
  // 親タグ（グループ）
  {
    id: "tax.crustacean",
    name: "甲殻類",
    category: "taxonomy",
    displayPriority: "high",
    synonyms: ["こうかくるい"],
    isSystemDefined: true,
  },
  {
    id: "tax.oily_fish",
    name: "青魚",
    category: "taxonomy",
    displayPriority: "high",
    synonyms: ["あおざかな"],
    isSystemDefined: true,
  },
  {
    id: "tax.nuts",
    name: "ナッツ類",
    category: "taxonomy",
    displayPriority: "high",
    synonyms: ["ナッツ", "木の実"],
    isSystemDefined: true,
  },
  {
    id: "tax.shellfish",
    name: "貝類",
    category: "taxonomy",
    displayPriority: "high",
    synonyms: ["かいるい"],
    isSystemDefined: true,
  },
  {
    id: "tax.dairy",
    name: "乳製品",
    category: "taxonomy",
    displayPriority: "high",
    synonyms: ["にゅうせいひん", "デイリー"],
    isSystemDefined: true,
  },
  {
    id: "tax.animal_product",
    name: "動物性食品",
    category: "taxonomy",
    displayPriority: "normal",
    synonyms: ["どうぶつせい"],
    isSystemDefined: true,
  },
  {
    id: "tax.meat",
    name: "肉類",
    category: "taxonomy",
    displayPriority: "normal",
    parentTagId: "tax.animal_product",
    synonyms: ["にくるい"],
    isSystemDefined: true,
  },
  // 子タグ（個別食材分類）
  {
    id: "tax.sardine",
    name: "いわし",
    category: "taxonomy",
    displayPriority: "normal",
    parentTagId: "tax.oily_fish",
    synonyms: ["イワシ", "鰯"],
    isSystemDefined: true,
  },
  {
    id: "tax.saury",
    name: "さんま",
    category: "taxonomy",
    displayPriority: "normal",
    parentTagId: "tax.oily_fish",
    synonyms: ["サンマ", "秋刀魚"],
    isSystemDefined: true,
  },
  {
    id: "tax.cheese",
    name: "チーズ",
    category: "taxonomy",
    displayPriority: "normal",
    parentTagId: "tax.dairy",
    synonyms: ["ちーず"],
    isSystemDefined: true,
  },
  {
    id: "tax.high_mercury_fish",
    name: "高水銀魚",
    category: "taxonomy",
    displayPriority: "high",
    synonyms: ["マグロ", "メカジキ"],
    isSystemDefined: true,
  },
];

// ─── 食感タグ（texture） ───

const textureTags: Tag[] = [
  {
    id: "tex.nebaNeba",
    name: "ネバネバ",
    category: "texture",
    displayPriority: "normal",
    synonyms: ["ねばねば", "粘り気"],
    isSystemDefined: true,
  },
  {
    id: "tex.nuruNuru",
    name: "ぬるぬる",
    category: "texture",
    displayPriority: "normal",
    synonyms: ["ヌルヌル", "ぬめり"],
    isSystemDefined: true,
  },
  {
    id: "tex.toroToro",
    name: "トロトロ",
    category: "texture",
    displayPriority: "normal",
    synonyms: ["とろとろ", "トロリ"],
    isSystemDefined: true,
  },
  {
    id: "tex.puriPuri",
    name: "ぷりぷり",
    category: "texture",
    displayPriority: "normal",
    synonyms: ["プリプリ"],
    isSystemDefined: true,
  },
  {
    id: "tex.korikori",
    name: "コリコリ",
    category: "texture",
    displayPriority: "normal",
    synonyms: ["こりこり"],
    isSystemDefined: true,
  },
];

// ─── 匂いタグ（odor） ───

const odorTags: Tag[] = [
  {
    id: "odor.strong",
    name: "においが強い",
    category: "odor",
    displayPriority: "normal",
    synonyms: ["臭い", "くさい"],
    isSystemDefined: true,
  },
  {
    id: "odor.fishy",
    name: "魚臭い",
    category: "odor",
    displayPriority: "normal",
    synonyms: ["生臭い"],
    isSystemDefined: true,
  },
];

// ─── 健康リスクタグ（risk） ───

const riskTags: Tag[] = [
  {
    id: "risk.listeria",
    name: "リステリアリスク",
    category: "risk",
    displayPriority: "critical",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "risk.toxoplasma",
    name: "トキソプラズマリスク",
    category: "risk",
    displayPriority: "critical",
    synonyms: [],
    isSystemDefined: true,
  },
  {
    id: "risk.mercury",
    name: "高水銀",
    category: "risk",
    displayPriority: "critical",
    synonyms: ["水銀リスク"],
    isSystemDefined: true,
  },
];

// ─── 全タグ ───

export const allTags: Tag[] = [
  ...mandatoryAllergenTags,
  ...recommendedAllergenTags,
  ...taxonomyTags,
  ...textureTags,
  ...odorTags,
  ...riskTags,
];

// ─── プリセット ───

export const pregnancyPreset: RestrictionPreset = {
  id: "pregnancy",
  name: "妊婦",
  tagIds: ["risk.listeria", "risk.toxoplasma", "risk.mercury"],
  isEditable: true,
};

export const allPresets: RestrictionPreset[] = [pregnancyPreset];

// ─── 調理状態ルール ───

export const cookingStateRules: CookingStateRule[] = [
  {
    condition: { cookingState: "raw", requiresTag: "tax.animal_product" },
    derivedTagId: "risk.listeria",
  },
  {
    condition: { cookingState: "semi_raw", requiresTag: "tax.meat" },
    derivedTagId: "risk.toxoplasma",
  },
  // 水銀は加熱で除去不可 → 全調理状態で risk.mercury を導出
  {
    condition: { cookingState: "raw", requiresTag: "tax.high_mercury_fish" },
    derivedTagId: "risk.mercury",
  },
  {
    condition: { cookingState: "cooked", requiresTag: "tax.high_mercury_fish" },
    derivedTagId: "risk.mercury",
  },
  {
    condition: { cookingState: "semi_raw", requiresTag: "tax.high_mercury_fish" },
    derivedTagId: "risk.mercury",
  },
];

// ─── ヘルパー関数 ───

export function findTagById(id: string): Tag | undefined {
  return allTags.find((t) => t.id === id);
}

export function getTagsByCategory(category: TagCategory): Tag[] {
  return allTags.filter((t) => t.category === category);
}

export function getChildTags(parentTagId: string): Tag[] {
  return allTags.filter((t) => t.parentTagId === parentTagId);
}

export function findTagByName(name: string): Tag | undefined {
  return allTags.find((t) => t.name === name || t.synonyms.includes(name));
}

/** カスタムタグを含む全タグ配列を返す */
export function getAllTagsWithCustom(
  customItems: { name: string; category: TagCategory }[],
): Tag[] {
  const customTags: Tag[] = customItems.map((item) => ({
    id: `custom.${item.category}.${item.name}`,
    name: item.name,
    category: item.category,
    displayPriority: "normal",
    synonyms: [],
    isSystemDefined: false,
  }));
  return [...allTags, ...customTags];
}
