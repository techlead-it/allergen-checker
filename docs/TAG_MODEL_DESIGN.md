# 統一タグモデル設計書：妊婦対応＋曖昧食材対応

---

## 0. 本書の位置づけ

本書は、既存のアレルゲンチェックシステム（MVP）に対して、以下の2つの課題を解決するためのデータモデル・UI/UX・判定ロジックの拡張設計を定義する。

### 解決する課題

1. **妊婦対応**: 生もの・特定食材のNGなど、アレルゲンとは異なる軸での食材制限
2. **曖昧な食材記述への対応**: 顧客が予約時に「ねばねばしたもの」「においが強いもの」等と記述した場合のマッチング

### 設計方針

**「実装は統一、表示はカテゴリ別分離」**

アレルゲン・食材特性・妊婦制限をすべて「タグ」として統一し、判定ロジックを1本化する。UIではカテゴリ別にグループ化して表示し、オペレーターの認知負荷を抑える。

---

## 1. データモデル

### 1.1 タグ定義

```typescript
/** タグのカテゴリ */
type TagCategory =
  | "allergen_mandatory"   // 特定原材料8品目（法的表示義務）
  | "allergen_recommended" // 準特定原材料20品目（推奨表示）
  | "allergen_custom"      // 施設独自アレルゲン
  | "taxonomy"             // 食材分類（甲殻類、青魚、ナッツ類）
  | "texture"              // 食感・性質（ネバネバ、ぬるぬる）
  | "odor"                 // 匂い（においが強い）
  | "risk"                 // 健康リスク（高水銀、リステリアリスク）

/** タグの表示優先度 */
type DisplayPriority = "critical" | "high" | "normal";

/** タグ定義（マスタデータ） */
type Tag = {
  id: string;
  name: string;
  category: TagCategory;
  displayPriority: DisplayPriority;
  parentTagId?: string;        // 階層（例: 甲殻類 → えび）
  synonyms: string[];          // 表記ゆれ・同義語
  isSystemDefined: boolean;    // true: システム定義（編集不可）, false: 施設定義
};
```

### 1.2 食材へのタグ付与

```typescript
/** 食材に付与されたタグ */
type TagAttachment = {
  tagId: string;
  source: "ai" | "manual" | "master";  // 付与元
  confirmed: boolean;                    // 確定済みか
  evidence?: string;                     // 根拠（原材料表、OCR結果、担当者名等）
};

/** 食材（拡張後） */
type Ingredient = {
  id: number;
  name: string;
  category: IngredientCategory;  // "主食材" | "調味料" | "共通仕込み"
  tags: TagAttachment[];         // 統一タグ（allergens を置換）
};
```

### 1.3 レシピ×食材の紐づけ（調理状態付き）

```typescript
/** 調理状態 */
type CookingState = "raw" | "cooked" | "semi_raw";

/** レシピと食材の紐づけ */
type RecipeIngredientLink = {
  ingredientId: number;
  cookingState: CookingState;  // この料理での調理状態
};
```

**設計根拠**: 同一食材（例: サーモン）が生でも加熱でも使われるため、調理状態は食材の属性ではなくレシピとの紐づけに持たせる。

### 1.4 顧客のNG条件

```typescript
/** 顧客の制限条件（統一） */
type CustomerRestriction = {
  tagId: string;
  source: "self_report" | "medical" | "preset";  // 情報源
  note?: string;                                   // 補足メモ
};

/** 顧客（拡張後） */
type Customer = {
  id: number;
  name: string;
  roomName: string;
  checkInDate: string;
  restrictions: CustomerRestriction[];  // 統一NG条件（allergens を置換）
  presets: string[];                    // 適用中プリセット（例: "pregnancy"）
  condition: string;                    // "微量NG" | "少量可" | "条件付き" | "不明"
  contamination: string;               // "不可" | "要確認" | "可"
  notes: string;
  originalText: string;                // 入力原文（監査証跡）
};
```

### 1.5 プリセット定義

```typescript
/** プリセット（妊婦、乳幼児等） */
type RestrictionPreset = {
  id: string;           // 例: "pregnancy"
  name: string;         // 例: "妊婦"
  tagIds: string[];     // 自動適用するタグIDリスト
  isEditable: boolean;  // 施設管理者が編集可能か
};
```

---

## 2. タグ階層設計（taxonomy）

### 2.1 階層の仕組み

`parentTagId` により親子関係を定義する。**顧客が親タグをNG指定した場合、その子タグを持つ食材もすべてNG判定される。**

### 2.2 具体的な階層ツリー

```
甲殻類（tax.crustacean）
├── えび（allergen.shrimp）
└── かに（allergen.crab）

青魚（tax.oily_fish）
├── さば（allergen.mackerel）
├── いわし（tax.sardine）
└── さんま（tax.saury）

ナッツ類（tax.nuts）
├── 落花生（allergen.peanut）
├── くるみ（allergen.walnut）
├── アーモンド（allergen.almond）
└── カシューナッツ（allergen.cashew）

貝類（tax.shellfish）
├── あわび（allergen.abalone）
└── いか（allergen.squid）

乳製品（tax.dairy）
├── 乳（allergen.milk）
└── チーズ（tax.cheese）
```

### 2.3 判定時の親子推論ロジック

```
function getEffectiveTags(tagId: string, allTags: Tag[]): string[] {
  // tagIdとそのすべての子孫タグIDを返す
  const result = [tagId];
  const children = allTags.filter(t => t.parentTagId === tagId);
  for (const child of children) {
    result.push(...getEffectiveTags(child.id, allTags));
  }
  return result;
}
```

顧客が `tax.crustacean`（甲殻類）をNG指定 → `allergen.shrimp`（えび）、`allergen.crab`（かに）も自動的にNG。

---

## 3. 初期タグセット

### 3.1 アレルゲンタグ（既存28品目をタグ化）

#### 特定原材料8品目（allergen_mandatory / critical）

| ID                 | 名称   | displayPriority |
| ------------------ | ------ | --------------- |
| allergen.egg       | 卵     | critical        |
| allergen.milk      | 乳     | critical        |
| allergen.wheat     | 小麦   | critical        |
| allergen.buckwheat | そば   | critical        |
| allergen.peanut    | 落花生 | critical        |
| allergen.shrimp    | えび   | critical        |
| allergen.crab      | かに   | critical        |
| allergen.walnut    | くるみ | critical        |

#### 準特定原材料20品目（allergen_recommended / high）

| ID                  | 名称           | displayPriority |
| ------------------- | -------------- | --------------- |
| allergen.abalone    | あわび         | high            |
| allergen.squid      | いか           | high            |
| allergen.salmon_roe | いくら         | high            |
| allergen.orange     | オレンジ       | high            |
| allergen.cashew     | カシューナッツ | high            |
| allergen.kiwi       | キウイフルーツ | high            |
| allergen.beef       | 牛肉           | high            |
| allergen.sesame     | ごま           | high            |
| allergen.salmon     | さけ           | high            |
| allergen.mackerel   | さば           | high            |
| allergen.soybean    | 大豆           | high            |
| allergen.chicken    | 鶏肉           | high            |
| allergen.banana     | バナナ         | high            |
| allergen.pork       | 豚肉           | high            |
| allergen.matsutake  | まつたけ       | high            |
| allergen.peach      | もも           | high            |
| allergen.yam        | やまいも       | high            |
| allergen.apple      | りんご         | high            |
| allergen.gelatin    | ゼラチン       | high            |
| allergen.almond     | アーモンド     | high            |

### 3.2 食材分類タグ（taxonomy / high）

| ID             | 名称     | parentTagId   | displayPriority |
| -------------- | -------- | ------------- | --------------- |
| tax.crustacean | 甲殻類   | —             | high            |
| tax.oily_fish  | 青魚     | —             | high            |
| tax.nuts       | ナッツ類 | —             | high            |
| tax.shellfish  | 貝類     | —             | high            |
| tax.dairy      | 乳製品   | —             | high            |
| tax.sardine    | いわし   | tax.oily_fish | normal          |
| tax.saury      | さんま   | tax.oily_fish | normal          |
| tax.cheese     | チーズ   | tax.dairy     | normal          |

### 3.3 食感タグ（texture / normal）

| ID           | 名称     | synonyms         | displayPriority |
| ------------ | -------- | ---------------- | --------------- |
| tex.nebaNeba | ネバネバ | ねばねば, 粘り気 | normal          |
| tex.nuruNuru | ぬるぬる | ヌルヌル, ぬめり | normal          |
| tex.toroToro | トロトロ | とろとろ, トロリ | normal          |
| tex.puriPuri | ぷりぷり | プリプリ         | normal          |
| tex.korikori | コリコリ | こりこり         | normal          |

### 3.4 匂いタグ（odor / normal）

| ID          | 名称         | synonyms     | displayPriority |
| ----------- | ------------ | ------------ | --------------- |
| odor.strong | においが強い | 臭い, くさい | normal          |
| odor.fishy  | 魚臭い       | 生臭い       | normal          |

### 3.5 健康リスクタグ（risk / critical）

| ID              | 名称                 | 根拠                                                                                   | displayPriority |
| --------------- | -------------------- | -------------------------------------------------------------------------------------- | --------------- |
| risk.listeria   | リステリアリスク     | 非加熱のナチュラルチーズ、生ハム、スモークサーモン等（厚労省ガイドライン）             | critical        |
| risk.toxoplasma | トキソプラズマリスク | 加熱不十分な肉（特に豚・羊）（食品安全委員会）                                         | critical        |
| risk.mercury    | 高水銀               | マグロ、メカジキ等の大型回遊魚（厚労省「妊婦への魚介類の摂食と水銀に関する注意事項」） | critical        |

---

## 4. プリセット定義

### 4.1 妊婦プリセット

```typescript
const pregnancyPreset: RestrictionPreset = {
  id: "pregnancy",
  name: "妊婦",
  tagIds: [
    "risk.listeria",       // リステリアリスク食品を回避
    "risk.toxoplasma",     // 加熱不十分な肉を回避
    "risk.mercury",        // 高水銀の魚を回避
  ],
  isEditable: true,  // 施設管理者がカスタマイズ可能
};
```

**根拠**:
- リステリア: 厚労省「妊産婦の食中毒予防」パンフレット
- トキソプラズマ: 食品安全委員会「お母さんになるあなたへ」
- 水銀: 厚労省「妊婦への魚介類の摂食と水銀に関する注意事項」

**注意**: プリセットは「推奨」であり、法的拘束力はない。施設の判断で編集可能とする。

### 4.2 cookingState との連動（Derived Tag）

妊婦プリセットで「生ものNG」を実現するため、判定時に**調理状態から導出タグ（Derived Tag）**を生成する。

```typescript
/** 調理状態から導出されるルール */
type CookingStateRule = {
  condition: {
    cookingState: CookingState;    // "raw" | "semi_raw"
    requiresTag?: string;          // 食材がこのタグを持つ場合のみ（例: 動物性食品）
  };
  derivedTagId: string;            // 導出されるタグID
};

// ルール定義
const cookingStateRules: CookingStateRule[] = [
  {
    // 動物性食品が生の場合 → リステリアリスク導出
    condition: { cookingState: "raw", requiresTag: "tax.animal_product" },
    derivedTagId: "risk.listeria",
  },
  {
    // 肉が半生の場合 → トキソプラズマリスク導出
    condition: { cookingState: "semi_raw", requiresTag: "tax.meat" },
    derivedTagId: "risk.toxoplasma",
  },
];
```

**判定フロー例**:
- サーモン（cookingState=raw, tags=[tax.animal_product]）→ `risk.listeria` 導出 → 妊婦NG
- サーモン（cookingState=cooked, tags=[tax.animal_product]）→ 導出なし → OK

---

## 5. 判定ロジック

### 5.1 統一判定関数

```typescript
function checkIngredient(
  ingredient: Ingredient,
  link: RecipeIngredientLink,
  customerRestrictions: CustomerRestriction[],
  allTags: Tag[],
  cookingStateRules: CookingStateRule[],
): IngredientCheckResult {
  // 1. 食材のタグIDを収集
  const ingredientTagIds = ingredient.tags.map(t => t.tagId);

  // 2. cookingState から導出タグを追加
  for (const rule of cookingStateRules) {
    if (link.cookingState === rule.condition.cookingState) {
      if (!rule.condition.requiresTag || ingredientTagIds.includes(rule.condition.requiresTag)) {
        ingredientTagIds.push(rule.derivedTagId);
      }
    }
  }

  // 3. 顧客のNG条件を展開（親タグ → 子タグの展開）
  const expandedRestrictionTagIds = new Set<string>();
  for (const restriction of customerRestrictions) {
    for (const effectiveId of getEffectiveTags(restriction.tagId, allTags)) {
      expandedRestrictionTagIds.add(effectiveId);
    }
  }

  // 4. 交差判定
  const matchedTagIds = ingredientTagIds.filter(id => expandedRestrictionTagIds.has(id));

  // 5. 判定
  let judgment: Judgment;
  if (matchedTagIds.length > 0) {
    judgment = "NG";
  } else {
    // 未確定タグの扱い
    const hasUnconfirmedCritical = ingredient.tags.some(t => {
      const tag = allTags.find(at => at.id === t.tagId);
      return !t.confirmed && tag?.displayPriority === "critical";
    });
    const hasUnconfirmedOther = ingredient.tags.some(t => !t.confirmed);

    if (hasUnconfirmedCritical) {
      // 法的アレルゲンが未確定 → NG寄り（安全側）
      judgment = "NG";
    } else if (hasUnconfirmedOther) {
      judgment = "要確認";
    } else {
      judgment = "OK";
    }
  }

  return {
    judgment,
    matchedTagIds,
    matchedReasons: matchedTagIds.map(id => ({
      tagId: id,
      tagName: allTags.find(t => t.id === id)?.name ?? id,
      category: allTags.find(t => t.id === id)?.category,
    })),
  };
}
```

### 5.2 判定優先度

| 条件                                 | 判定             |
| ------------------------------------ | ---------------- |
| マッチしたタグがある                 | **NG**           |
| マッチなし、criticalタグが未確定     | **NG**（安全側） |
| マッチなし、non-criticalタグが未確定 | **要確認**       |
| マッチなし、全タグ確定済み           | **OK**           |

---

## 6. UI/UX設計

### 6.1 食材取込画面（ImportPage）

#### 一覧画面

```
┌─────────────────────────────────────────────────────────────┐
│ [検索] [未確定のみ] [critical/highのみ] [一括操作▼]         │
│                                                             │
│ ┌──────────┬────────────────────────────┬─────────────┐     │
│ │ 食材名   │ タグ（重要度順）           │ 状態        │     │
│ ├──────────┼────────────────────────────┼─────────────┤     │
│ │ ☐ えび   │ 🔴えび 🔴甲殻類*           │ ⚠ 要確認    │     │
│ │          │ 🟡ぷりぷり(AI)             │ (必須確定)  │     │
│ ├──────────┼────────────────────────────┼─────────────┤     │
│ │ ☐ 納豆   │ 🟡大豆  🔵ネバネバ(master) │ ✅ 確定     │     │
│ ├──────────┼────────────────────────────┼─────────────┤     │
│ │ ☐ 醤油   │ 🔴大豆(AI) 🔴小麦(AI)      │ ⚠ 要確認    │     │
│ └──────────┴────────────────────────────┴─────────────┘     │
│                                                             │
│ 右パネル（選択時）:                                         │
│ ┌─────────────────────────────────────────┐                 │
│ │ 選択: 3件                               │                 │
│ │ [AI全採用] [タグ一括追加] [一括確定]    │                 │
│ └─────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

**タグチップの色ルール**:
- 🔴 赤 = critical（特定原材料8品目）
- 🟡 黄 = high（準特定原材料20品目、taxonomy）
- 🔵 青 = normal（texture, odor, risk）
- `*` = 親タグからの推論で付与されたタグ
- `(AI)` = AI推定（未確定）、`(master)` = マスタデータから、`(手動)` = 手動追加

**正規化の負担軽減策**:
- 「未確定のみ」フィルタでレビュー対象を最小化
- バルク操作（複数食材にタグを一括適用）
- AI推定の1クリック採用/却下
- 類似食材のタグコピー機能

#### 詳細モーダル

```
┌────────────────────────────────────────────────┐
│ 原材料原文: "えび、食塩、でん粉…"              │
│ 正規化候補: [えび] [車えび] [甘えび]           │
│                                                │
│ ── 必須アレルゲン (critical) ──                │
│ えび    [✅確定] evidence: "規格書p.2"         │
│ 甲殻類  [⚠未確定] evidence: "親タグ推論"       │
│                                                │
│ ── 食材特性 ──                                 │
│ ぷりぷり (AI推定) [採用] [却下]                │
│ +タグ追加 [検索欄]                             │
│                                                │
│ ── 推論情報 ──                                 │
│ 甲殻類 → えび の親子関係により自動付与         │
│                                                │
│ [保存] [閉じる]                                │
└────────────────────────────────────────────────┘
```

### 6.2 顧客登録画面（CustomerFormPage）

```
┌────────────────────────────────────────────────────┐
│                                                    │
│ ── 基本情報 ──                                     │
│ 氏名: [________]  部屋: [▼選択]                    │
│ チェックイン日: [____-__-__]                       │
│                                                    │
│ ── プリセット ──                                   │
│ [妊婦を適用] → 適用中: risk.listeria,              │
│                risk.toxoplasma, risk.mercury       │
│   (個別解除可: 各タグの×ボタン)                    │
│                                                    │
│ ── NG条件（カテゴリ別選択） ──                     │
│                                                    │
│ 🔴 特定原材料（法的義務）                          │
│ [ ] 卵  [ ] 乳  [x] えび  [ ] かに  [ ] 小麦       │
│ [ ] そば  [ ] 落花生  [ ] くるみ                   │
│                                                    │
│ 🟡 準特定原材料                                    │
│ [ ] いか  [ ] さけ  [x] さば  [ ] 大豆 ...         │
│                                                    │
│ 🟡 食材分類                                        │
│ [x] 甲殻類  [ ] 青魚  [ ] ナッツ類  [ ] 貝類       │
│ → 甲殻類を選択 → えび,かに が自動NG（推論表示）    │
│                                                    │
│ 🔵 食感・性質                                      │
│ [x] ネバネバ  [ ] ぬるぬる  [ ] トロトロ           │
│                                                    │
│ 🔵 匂い                                            │
│ [ ] においが強い  [ ] 魚臭い                       │
│                                                    │
│ ── 重症度 / コンタミ ──                            │
│ 重症度: [▼微量NG]  コンタミ: [▼不可]               │
│                                                    │
│ ── 補足情報 ──                                     │
│ 自由記述: [____________________]                   │
│ 入力原文: [____________________]（監査証跡）       │
│                                                    │
│ ── 選択タグサマリ ──                               │
│ えび(自己申告) / 甲殻類(自己申告)                  │
│ さば(自己申告) / ネバネバ(自己申告)                │
│ リステリアリスク(妊婦preset)                       │
│ トキソプラズマリスク(妊婦preset)                   │
│ 高水銀(妊婦preset)                                 │
│                                                    │
│ [保存] [キャンセル]                                │
└────────────────────────────────────────────────────┘
```

**主要なUXポイント**:
- **妊婦プリセット**: 1クリック適用、適用後にどのタグが追加されたか表示、個別解除可能
- **食材分類の推論表示**: 「甲殻類」を選択 → 「えび、かにも自動的にNGになります」と明示
- **カテゴリ別セクション**: critical → high → normal の順で表示、色分けで重要度を視覚化
- **選択タグサマリ**: 最下部に全選択タグと情報源を一覧表示

### 6.3 判定画面（AssignmentDetailPage）

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│ フィルタ: [NGのみ] [要確認のみ] [法的アレルゲンのみ]         │
│ サマリ: NG 2件 / 要確認 1件 / OK 5件                         │
│                                                              │
│ ┌─── 料理: えびチャーハン ──── 判定: 🔴 NG ────────────┐     │
│ │                                                      │     │
│ │ 🔴 法的アレルゲン一致:                               │     │
│ │   えび → 顧客NG: えび（自己申告）                    │     │
│ │   甲殻類 → 顧客NG: 甲殻類（自己申告）                │     │
│ │                                                      │     │
│ │ 🔵 特性一致:                                         │     │
│ │   （なし）                                           │     │
│ │                                                      │     │
│ │ [▼ 食材詳細を展開]                                   │     │
│ │ [代替料理を提案] [この料理を除外] [メモ追加]         │     │
│ └──────────────────────────────────────────────────────┘     │
│                                                              │
│ ┌─── 料理: 刺身盛り合わせ ── 判定: 🔴 NG ──────────────┐     │
│ │                                                      │     │
│ │ 🔴 妊婦制限一致:                                     │     │
│ │   サーモン(raw) → リステリアリスク（妊婦preset）     │     │
│ │   マグロ(raw) → 高水銀（妊婦preset）                 │     │
│ │                                                      │     │
│ │ [▼ 食材詳細を展開]                                   │     │
│ │ [代替料理を提案] [この料理を除外] [メモ追加]         │     │
│ └──────────────────────────────────────────────────────┘     │
│                                                              │
│ ┌─── 料理: ネバネバ丼 ──── 判定: 🟡 要確認 ────────────┐     │
│ │                                                      │     │
│ │ 🔵 特性一致:                                         │     │
│ │   納豆 → ネバネバ（自己申告）                        │     │
│ │   オクラ → ネバネバ（AI推定・未確定）                │     │
│ │                                                      │     │
│ │ [▼ 食材詳細を展開]                                   │     │
│ │ [食材除外: オクラ] [メモ追加]                        │     │
│ └──────────────────────────────────────────────────────┘     │
│                                                              │
│ ┌─── 料理: 焼き野菜 ──── 判定: ✅ OK ──────────────────┐     │
│ │ ヒット理由: なし                                     │     │
│ └──────────────────────────────────────────────────────┘     │
│                                                              │
│ ステータス: [未確認] → [確認済] → [厨房共有済]               │
└──────────────────────────────────────────────────────────────┘
```

**判断疲れ軽減の工夫**:
- **フィルタ**: NG/要確認のみに絞り込み可能。OKの料理は折りたたみ
- **マッチ理由の明示**: どのタグがどの根拠でヒットしたかを一目で把握
- **法的アレルゲンの強調**: 🔴 で常に最上位表示
- **アクションボタン**: 代替提案・除外・メモの即時操作

### 6.4 タグマスタ管理画面（新規）

既存の「アレルゲン管理（/allergens）」画面を拡張し、全カテゴリのタグを管理する画面。

**機能**:
- システム定義タグの参照（28品目、リスクタグ等。編集不可）
- 施設独自タグの追加・編集・削除
- タグ階層（parentTagId）の設定
- 同義語（synonyms）の管理
- プリセットの内容編集

---

## 7. ワークフロー全体像

```
1. 食材取込（ImportPage）
   - ファイルアップロード → OCR/解析
   - AI推定でアレルゲンタグ + 特性タグを自動付与
   - 未確定タグのレビュー → 確定
   - 全件確定後にDB反映

2. レシピ管理（RecipeLinkPage）
   - レシピ作成 → 食材紐づけ
   - 各食材の調理状態（cookingState）を設定  ← NEW
   - 食材のタグが自動でレシピに継承

3. コース管理（CoursePage）
   - コース作成 → レシピ追加 → 提供順設定
   （変更なし）

4. 顧客登録（CustomerFormPage）
   - 基本情報入力
   - プリセット適用（妊婦等）  ← NEW
   - NG条件をカテゴリ別タグ選択で入力  ← NEW
   - 原文メモ記録

5. 割当 & 判定（DashboardPage → AssignmentDetailPage）
   - 顧客×コース割当作成
   - 統一タグ判定（アレルゲン + 特性 + cookingState導出）  ← NEW
   - マッチ理由付きの判定結果表示  ← NEW
   - カスタマイズ（代替・除外・食材変更）
   - ステータス更新

6. 厨房シート（KitchenPage）
   - 判定理由も表示（「ネバネバ → 顧客忌避」等）  ← NEW

7. タグマスタ管理（TagManagementPage）  ← NEW
   - タグ定義・階層・同義語・プリセットの管理
```

---

## 8. 設計上の注意事項

### 8.1 安全性

- `allergen_mandatory`（特定原材料8品目）は **未確定の場合NG判定**とし、安全側に倒す
- 法的アレルゲンは UI で常に最上位・赤色表示し、他のタグと混同させない
- `allergen_mandatory` タグは `confirmed: true` にならない限り判定を通過できない

### 8.2 運用リスク

- **タグ増殖**: 初期は本書で定義したタグに限定し、施設独自タグは管理者の承認制にする
- **妊婦制限の責任**: プリセットは「推奨」であり、施設の責任で調整可能とする
- **AI推定の限界**: AI推定は補助的な位置づけ。最終確定は必ず人間が行う

### 8.3 後方互換性

既存の `allergens: string[]` から `tags: TagAttachment[]` への移行:
- 既存の allergens 配列の各要素を `allergen.*` タグIDに変換
- `source: "master"`, `confirmed: true` として移行
- `allergenUnknown: true` の食材は `confirmed: false` として移行

---

## 9. 議論の経緯

本設計はClaude（Opus 4.6）とCodex（GPT-5.2）の壁打ちにより策定した。主要な議論ポイント:

| 論点                 | 結論                  | 根拠                                |
| -------------------- | --------------------- | ----------------------------------- |
| 3軸分離 vs 統一タグ  | 統一（表示のみ分離）  | 判定ロジック1本化、保守コスト低減   |
| AI信頼度の粒度       | 2状態（推定/確定）    | MVP十分、confidence scoreは将来拡張 |
| 調理状態の所属       | レシピ×食材紐づけ     | 同一食材が複数調理状態で使われる    |
| 顧客入力UI           | B型（タグ選択ベース） | 構造化入力で運用負担最小            |
| 法的タグの統一可否   | 統一OK + UI強制分離   | モデル統一は監査上の弱点にならない  |
| 未確定criticalの判定 | NG寄り                | 安全側に倒す原則                    |
