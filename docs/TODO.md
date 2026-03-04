# TODO: 統一タグモデル実装

作成日: 2026-03-03
生成元: planning-tasks
設計書: docs/TAG_MODEL_DESIGN.md

## 概要

既存のアレルゲンチェックシステムに「統一タグモデル」を導入し、妊婦対応＋曖昧食材対応を実現する。
既存の `allergens: string[]` を `tags: TagAttachment[]` / `restrictions: CustomerRestriction[]` に移行し、
判定ロジックを統一タグ交差判定に置き換える。

### 移行の影響範囲

- **型定義**: types.ts の Ingredient, Customer, Recipe 等を拡張
- **データ**: mock.ts の allergen28Items → タグマスタ、モックデータの移行
- **判定ロジック**: allergenCheck.ts を統一タグ判定に全面書き換え
- **UI**: 全7画面中6画面に影響（CoursePage以外すべて）
- **新規画面**: タグマスタ管理画面（TagManagementPage）

## 実装タスク

### フェーズ1: テスト基盤の構築

テストフレームワークが未導入のため、TDDを始める前にvitestをセットアップする。

- [x] vitest + @testing-library/react + jsdom のインストールと設定
  - vitest.config.ts 作成、package.json の test スクリプト追加
  - tsconfig に test 用設定追加
  - 動作確認用のサンプルテスト作成・実行
- [x] [CHECK] lint/format/build/test の実行と確認

### フェーズ2: タグマスタデータの定義

TAG_MODEL_DESIGN.md §1.1, §3 に基づき、タグの型とマスタデータを定義する。
既存コードには触れず、新規ファイルのみ追加する構造的変更。

- [x] [RED] タグ型定義のテストを作成
  - Tag, TagCategory, DisplayPriority, TagAttachment, CustomerRestriction, CookingState, CookingStateRule, RestrictionPreset の型が正しく使えることを検証
- [x] [GREEN] src/data/types.ts に新しい型定義を追加
  - 既存の型（Ingredient, Customer等）はまだ変更しない
  - TAG_MODEL_DESIGN.md §1.1〜§1.5 の全型を定義
- [x] [RED] タグマスタデータのテストを作成
  - 28品目が正しくタグ化されているか（id, name, category, displayPriority）
  - taxonomy タグの parentTagId 階層が正しいか
  - texture/odor/risk タグが定義されているか
  - cookingStateRules が参照する taxonomy タグ（tax.animal_product, tax.meat）が存在するか
  - 妊婦プリセットが正しいタグIDを参照しているか
  - cookingStateRules が正しく定義されているか
- [x] [GREEN] src/data/tags.ts にタグマスタデータを作成
  - allergen28Items をベースに allergen_mandatory/recommended タグを生成
  - taxonomy, texture, odor, risk タグを TAG_MODEL_DESIGN.md §3.2〜§3.5 に従い定義
  - cookingStateRules が参照する taxonomy タグ（tax.animal_product, tax.meat 等）も定義 ※§3.2に未記載だが§4.2で必要
  - 妊婦プリセット（pregnancyPreset）を定義
  - cookingStateRules を定義
- [x] [REFACTOR] タグデータの整理とヘルパー関数追加
  - findTagById(), getTagsByCategory(), getChildTags() 等のルックアップ関数
- [x] [REVIEW] フェーズ実装の簡易セルフレビューと修正
- [x] [CHECK] lint/format/build/test の実行と確認

### フェーズ3: タグ階層推論ロジック

TAG_MODEL_DESIGN.md §2.3 に基づき、親子タグの推論ロジックを実装する。

- [x] [RED] getEffectiveTags() のテストを作成
  - 単一タグ → 自身のみ返す
  - 親タグ → 自身 + 全子孫を返す（tax.crustacean → [tax.crustacean, allergen.shrimp, allergen.crab]）
  - 深い階層（3段以上）でも正しく再帰する
  - 子のないタグ → 自身のみ返す
  - 存在しないタグID → 自身のみ返す（エラーにしない）
- [x] [GREEN] src/utils/tagHierarchy.ts に getEffectiveTags() を実装
- [x] [REFACTOR] 必要に応じてキャッシュや最適化（不要：実装が最小限）
- [x] [REVIEW] フェーズ実装の簡易セルフレビューと修正
- [x] [CHECK] lint/format/build/test の実行と確認

### フェーズ4: 統一判定ロジック

TAG_MODEL_DESIGN.md §4.2, §5 に基づき、新しい判定ロジックを実装する。
既存の allergenCheck.ts は維持し、新ファイルに並行実装する。

- [ ] [RED] cookingState 導出タグのテストを作成
  - raw + animal_product タグ → risk.listeria 導出
  - cooked + animal_product タグ → 導出なし
  - semi_raw + meat タグ → risk.toxoplasma 導出
  - 条件不一致 → 導出なし
- [ ] [GREEN] src/utils/derivedTags.ts に導出タグロジックを実装
- [x] [RED] checkIngredientByTags() のテストを作成
  - タグマッチあり → NG（マッチ理由付き）
  - タグマッチなし + 全確定 → OK
  - タグマッチなし + critical未確定 → NG（安全側）
  - タグマッチなし + normal未確定 → 要確認
  - 親タグNG → 子タグ持つ食材もNG（階層推論）
  - cookingState=raw で妊婦制限ヒット → NG
  - cookingState=cooked で妊婦制限なし → OK
- [x] [GREEN] src/utils/tagCheck.ts に checkIngredientByTags() を実装
- [x] [RED] checkDishByTags() のテストを作成
  - 全食材OK → 料理OK
  - 1食材NG → 料理NG（NG優先）
  - 1食材要確認 + 残りOK → 料理要確認
  - 除外食材が判定から除かれるか
  - マッチ理由が食材ごとに集約されるか
- [x] [GREEN] src/utils/tagCheck.ts に checkDishByTags() を実装
- [x] [REFACTOR] 判定ロジックの共通化・整理
- [x] [REVIEW] フェーズ実装の簡易セルフレビューと修正
- [x] [CHECK] lint/format/build/test の実行と確認

### フェーズ5: 既存型のタグモデル移行（STRUCTURAL）

既存の Ingredient, Customer, Recipe 型をタグモデルに移行する構造的変更。
Tidy Firstに従い、このフェーズでは動作変更なし。旧フィールドと新フィールドを並存させる。

- [x] [STRUCTURAL] Ingredient 型に tags: TagAttachment[] を追加
  - 既存の allergens: string[] と allergenUnknown?: boolean は残す（後方互換）
  - Recipe.linkedIngredients の型も連動更新
- [x] [STRUCTURAL] RecipeIngredientLink 型を追加し、Recipe に cookingState 情報を持たせる構造を検討
  - 現在 Recipe.linkedIngredients は Ingredient[] を直接保持
  - linkedIngredients の各要素に cookingState を追加するか、別構造にするか決定
  - ※ 現状の Recipe 型: `{ id, name, version, linkedIngredients: Ingredient[] }`
- [x] [STRUCTURAL] Customer 型に restrictions: CustomerRestriction[] と presets: string[] を追加
  - 既存の allergens: string[] は残す（後方互換）
- [x] [CHECK] lint/format/build/test の実行と確認（既存テスト＋新テストがすべてパス）

### フェーズ6: モックデータの移行

mock.ts のモックデータにタグ情報を付与する。既存データとの互換性を維持。

- [x] [RED] モックデータ移行のテストを作成
  - 既存 ingredients のすべてに tags フィールドが存在するか
  - 既存 customers のすべてに restrictions フィールドが存在するか
  - allergens と tags の整合性（allergens の各要素が tags にも存在する）
  - cookingState がレシピの食材紐づけに設定されているか
- [x] [GREEN] mock.ts のモックデータにタグ情報を追加
  - 各 Ingredient の allergens を基に TagAttachment[] を生成
  - 各 Customer の allergens を基に CustomerRestriction[] を生成
  - 各 Recipe の linkedIngredients に cookingState を追加
  - texture/odor/risk タグを適切な食材に付与（納豆→ネバネバ等）
- [x] [RED] localStorage マイグレーションのテストを作成
  - 旧形式（allergens: string[]）のデータを読み込んだ場合、新形式に変換されるか
  - 新形式のデータはそのまま読み込めるか
  - allergenUnknown: true → confirmed: false に変換されるか
- [x] [GREEN] 各 useXxx フックに localStorage マイグレーション処理を追加
- [x] [REFACTOR] マイグレーション処理の共通化
- [x] [REVIEW] フェーズ実装の簡易セルフレビューと修正
- [x] [CHECK] lint/format/build/test の実行と確認

### フェーズ7: 旧アレルゲンフィールドの削除（BEHAVIORAL）

旧 allergens: string[] と allergenUnknown を完全に削除し、タグモデルに一本化する。
判定ロジックも旧 allergenCheck.ts から新 tagCheck.ts に切り替える。

- [x] [BEHAVIORAL] Ingredient から allergens, allergenUnknown を削除、tags のみに統一
- [x] [BEHAVIORAL] Customer から allergens を削除、restrictions のみに統一
- [x] [BEHAVIORAL] 旧 allergenCheck.ts の checkIngredient/checkDish を削除し、tagCheck.ts に置き換え
  - 呼び出し元（AssignmentDetailPage, DashboardPage, KitchenPage, CustomerPage, RecipeLinkPage）の参照を一括更新
- [x] [BEHAVIORAL] resolveCustomizedDishes.ts はタグモデル変更の影響なし（確認済み）
- [x] 全テスト実行と確認（83テスト全通過）
- [x] [REVIEW] フェーズ実装の簡易セルフレビューと修正
- [x] [CHECK] lint/format/build/test の実行と確認

### フェーズ8: TagChip コンポーネント（UI基盤）

既存の AllergenChips / AllergenCheckboxGroup をタグモデル対応に置き換える新UIコンポーネント。

- [x] [RED] TagChip コンポーネントのテストを作成（7テスト）
- [x] [GREEN] src/components/TagChip.tsx を実装
- [x] [RED] TagCheckboxGroup コンポーネントのテストを作成（4テスト）
- [x] [GREEN] src/components/TagCheckboxGroup.tsx を実装
- [x] [RED] TagSummary コンポーネントのテストを作成（4テスト）
- [x] [GREEN] src/components/TagSummary.tsx を実装
- [x] [REFACTOR] 旧 AllergenChips/AllergenCheckboxGroup は後続フェーズ（9,10）で段階的に置き換え
- [x] [REVIEW] フェーズ実装の簡易セルフレビューと修正
- [x] [CHECK] lint/format/build/test の実行と確認（98テスト全通過）

### フェーズ9: 顧客登録画面の改修

TAG_MODEL_DESIGN.md §6.2 に基づき、CustomerFormPage をタグ選択UIに改修する。

- [x] [GREEN] CustomerFormPage をタグ選択UIに改修
  - AllergenCheckboxGroup → TagCheckboxGroup に置き換え
  - プリセットセクション追加（妊婦ボタン）
  - 選択タグサマリセクション追加
  - 保存処理を restrictions ベースに更新
- [x] [GREEN] CustomerListPage のアレルゲン表示をタグ表示に更新（restrictionNames利用）
- [x] [REVIEW] フェーズ実装の簡易セルフレビューと修正
- [x] [CHECK] lint/format/build/test の実行と確認（98テスト全通過）

### フェーズ10: 食材取込画面の改修

TAG_MODEL_DESIGN.md §6.1 に基づき、ImportPage をタグ表示・編集UIに改修する。

- [x] [GREEN] ImportPage の食材一覧をタグ表示に改修
  - AllergenChips → TagChip に置き換え（collectAllergenTags ヘルパーで名前→タグ変換）
- [x] [GREEN] IngredientDetailModal をタグ編集UIに改修
  - allergen28Items → allergenTags（getTagsByCategory利用）に置き換え
  - AllergenChips → TagChip に置き換え
- [x] [REVIEW] フェーズ実装の簡易セルフレビューと修正
- [x] [CHECK] lint/format/build/test の実行と確認（98テスト全通過）

### フェーズ11: レシピ管理画面の改修

TAG_MODEL_DESIGN.md §7 ワークフロー項目2 に基づき、RecipeLinkPage に調理状態の設定UIを追加する。

- [x] [GREEN] RecipeLinkPage に cookingState 選択UIを追加
  - 紐づけ済み食材の各行に cookingState ドロップダウン（生/加熱済/半生）追加
  - changeCookingState 関数追加、ingredientLinks を更新
  - デフォルトは cooked
- [x] [REVIEW] フェーズ実装の簡易セルフレビューと修正
- [x] [CHECK] lint/format/build/test の実行と確認（98テスト全通過）

### フェーズ12: 判定画面の改修

TAG_MODEL_DESIGN.md §6.3 に基づき、AssignmentDetailPage を統一タグ判定表示に改修する。

- [x] [GREEN] AssignmentDetailPage を統一タグ判定表示に改修
  - MatchedTagBadges → TagChip（matched=true）に置き換え
  - 判定フィルタUI追加（すべて/NG/要確認/OK クリック切り替え）
  - DashboardPage はPhase 7でタグ判定ベースに切り替え済み
- [x] [CHECK] lint/format/build/test の実行と確認（98テスト全通過）

### フェーズ13: 厨房シートの改修

TAG_MODEL_DESIGN.md §7 ワークフロー項目6 に基づき、KitchenPage に判定理由表示を追加。

- [x] [GREEN] KitchenPage をタグ表示に更新
  - アレルゲン表示 → TagChip に置き換え（画面表示用）
  - 印刷用にテキスト表示を維持
- [x] [CHECK] lint/format/build/test の実行と確認（98テスト全通過）

### フェーズ14: タグマスタ管理画面（新規）

TAG_MODEL_DESIGN.md §6.4 に基づき、既存のCustomAllergenPage を拡張してタグマスタ管理画面を構築。

- [x] [GREEN] CustomAllergenPage をタグ管理画面に拡張
  - 全タグカテゴリ表示（allergen_mandatory/recommended, taxonomy, texture, odor, risk）
  - TagChip でシステム定義タグをカテゴリ別セクション表示
  - プリセット管理セクション（妊婦プリセットのタグ一覧表示）
  - 施設独自タグの追加/削除（既存useCustomAllergensフック活用）
  - Layout.tsx のタイトルを「タグ管理」に更新
  - URLは /allergens のまま維持（既存リンク互換）
- [x] [CHECK] lint/format/build/test の実行と確認（98テスト全通過）

### フェーズ15: 統合テスト＆品質保証

- [x] [STRUCTURAL] 旧コードの完全削除
  - AllergenChips.tsx 削除（参照なし確認済み）
  - AllergenCheckboxGroup.tsx 削除（参照なし確認済み）
  - allergenCheck.ts は既にPhase 7で削除済み
  - allergen28Items を mock.ts から削除（tags.ts に完全移行済み）
  - AllergenCategory, AllergenItem 型定義を types.ts から削除（未使用）
- [x] 全テスト実行と確認（98テスト全通過）
- [x] [CHECK] lint/format/build/test の実行と確認

## 実装ノート

### MUSTルール遵守事項
- TDD: RED → GREEN → REFACTOR → REVIEW → CHECK サイクルを厳守
- REVIEW: 各フェーズ完了時に簡易セルフレビューを実施し、問題があればその場で修正
- CHECK: REVIEW後に lint/format/build/test を実行して最終確認
- Tidy First: 構造変更と動作変更を分離（フェーズ5はSTRUCTURAL、フェーズ7はBEHAVIORAL）
- コミット: [BEHAVIORAL] または [STRUCTURAL] プレフィックス必須

### 既存コードとの統合方針
- フェーズ2〜4: 新規ファイルのみ追加（既存コードに触れない）
- フェーズ5: 既存型に新フィールドを追加（旧フィールドは残す）
- フェーズ6: モックデータに新フィールドを追加 + localStorage マイグレーション
- フェーズ7: 旧フィールドを削除し一本化（ここが最大の破壊的変更）
- フェーズ8〜14: UIコンポーネントを順次更新

### Recipe 型の cookingState 統合について
現在の Recipe.linkedIngredients は `Ingredient[]` を直接保持している。
TAG_MODEL_DESIGN.md の RecipeIngredientLink を実現するため、以下のいずれかを選択：
- **案A**: `linkedIngredients` を `{ ingredient: Ingredient; cookingState: CookingState }[]` に変更
- **案B**: 別途 `ingredientLinks: RecipeIngredientLink[]` を追加し、linkedIngredients はID参照に変更
- フェーズ5で決定する（既存UIへの影響を最小化する案Aを推奨）

### テストフレームワーク
- vitest（Vite統合で高速、既存のvite.config.tsと親和性高い）
- @testing-library/react（UIコンポーネントテスト用）
- jsdom（ブラウザ環境エミュレーション）

### 参照ドキュメント
- 設計書: docs/TAG_MODEL_DESIGN.md
- 既存設計: docs/DESIGN.md
- MUSTルール: rules/core/tdd.md, rules/core/design.md, rules/core/commit.md
