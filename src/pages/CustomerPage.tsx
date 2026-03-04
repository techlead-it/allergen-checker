import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Customer, CustomerRestriction } from "../data/types";
import { ROOMS } from "../data/mock";
import { SearchableSelect } from "../components/SearchableSelect";
import { TagCheckboxGroup } from "../components/TagCheckboxGroup";
import { TagSummary } from "../components/TagSummary";
import { useCustomers } from "../hooks/useCustomers";
import { useCustomTags } from "../hooks/useCustomTags";
import { Modal } from "../components/Modal";
import { allPresets, getAllTagsWithCustom } from "../data/tags";
import type { TagCategory } from "../data/types";

function restrictionChipStyle(category: TagCategory | undefined): string {
  switch (category) {
    case "allergen_mandatory":
      return "bg-ng-bg text-ng border-ng-border";
    case "allergen_recommended":
    case "allergen_custom":
      return "bg-caution-bg text-caution border-caution-border";
    case "taxonomy":
    case "texture":
    case "odor":
      return "bg-primary/10 text-primary border-primary/30";
    case "risk":
      return "bg-ng-bg text-ng border-ng-border";
    default:
      return "bg-bg-cream text-text-secondary border-border";
  }
}

const CONDITIONS = ["微量NG", "少量可", "条件付き", "不明"] as const;
const CONTAMINATIONS = ["不可", "要確認", "可"] as const;

type CustomerForm = {
  name: string;
  roomName: string;
  checkInDate: string;
  selectedTagIds: string[];
  presets: string[];
  condition: string;
  contamination: string;
  notes: string;
  originalText: string;
};

function emptyForm(): CustomerForm {
  return {
    name: "",
    roomName: "",
    checkInDate: "",
    selectedTagIds: [],
    presets: [],
    condition: "不明",
    contamination: "要確認",
    notes: "",
    originalText: "",
  };
}

function formFromCustomer(c: Customer): CustomerForm {
  // self_report + medical の restriction tagIds を取得
  const selfTagIds = c.restrictions.filter((r) => r.source !== "preset").map((r) => r.tagId);
  return {
    name: c.name,
    roomName: c.roomName,
    checkInDate: c.checkInDate,
    selectedTagIds: selfTagIds,
    presets: c.presets,
    condition: c.condition,
    contamination: c.contamination,
    notes: c.notes,
    originalText: c.originalText,
  };
}

/** フォーム状態 → CustomerRestriction[] に変換 */
function buildRestrictions(selectedTagIds: string[], presetIds: string[]): CustomerRestriction[] {
  const restrictions: CustomerRestriction[] = selectedTagIds.map((tagId) => ({
    tagId,
    source: "self_report" as const,
  }));

  // プリセットから追加（重複回避）
  const selectedSet = new Set(selectedTagIds);
  for (const presetId of presetIds) {
    const preset = allPresets.find((p) => p.id === presetId);
    if (!preset) continue;
    for (const tagId of preset.tagIds) {
      if (!selectedSet.has(tagId)) {
        restrictions.push({ tagId, source: "preset" as const });
        selectedSet.add(tagId);
      }
    }
  }

  return restrictions;
}

// ─── Form View ───
function CustomerFormView({
  form,
  setForm,
  onSave,
  onCancel,
  submitLabel,
}: {
  form: CustomerForm;
  setForm: React.Dispatch<React.SetStateAction<CustomerForm>>;
  onSave: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const { items: customItems } = useCustomTags();
  const allTagsWithCustom = useMemo(() => getAllTagsWithCustom(customItems), [customItems]);

  function toggleTag(tagId: string) {
    setForm((prev) => ({
      ...prev,
      selectedTagIds: prev.selectedTagIds.includes(tagId)
        ? prev.selectedTagIds.filter((id) => id !== tagId)
        : [...prev.selectedTagIds, tagId],
    }));
  }

  function togglePreset(presetId: string) {
    setForm((prev) => ({
      ...prev,
      presets: prev.presets.includes(presetId)
        ? prev.presets.filter((id) => id !== presetId)
        : [...prev.presets, presetId],
    }));
  }

  // 表示用: 選択中のタグ + プリセットの全restriction
  const allRestrictions = buildRestrictions(form.selectedTagIds, form.presets);

  return (
    <div className="space-y-6">
      <button
        onClick={onCancel}
        className="text-sm text-primary hover:text-primary-dark font-medium cursor-pointer"
      >
        ← 一覧に戻る
      </button>

      <div className="bg-bg-card border border-border rounded-xl p-6 shadow-card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              顧客名 <span className="text-ng">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="例: 山田 太郎"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-card placeholder:text-text-muted/50 focus:border-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">部屋名</label>
            <SearchableSelect
              options={ROOMS.map((r) => ({ value: r, label: r }))}
              value={form.roomName}
              onChange={(v) => setForm((prev) => ({ ...prev, roomName: v as string }))}
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">チェックイン日</label>
            <input
              type="date"
              value={form.checkInDate}
              onChange={(e) => setForm((prev) => ({ ...prev, checkInDate: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-card focus:border-primary/50"
            />
          </div>
        </div>

        {/* プリセット */}
        {allPresets.length > 0 && (
          <div>
            <label className="block text-sm text-text-secondary mb-2">プリセット</label>
            <div className="flex flex-wrap gap-2">
              {allPresets.map((preset) => {
                const isActive = form.presets.includes(preset.id);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => togglePreset(preset.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer border transition-colors ${
                      isActive
                        ? "bg-primary text-white border-primary"
                        : "bg-bg-cream border-border text-text-secondary hover:border-primary/30"
                    }`}
                  >
                    {preset.name}
                    {isActive && " ✓"}
                  </button>
                );
              })}
            </div>
            {form.presets.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {form.presets.flatMap((presetId) => {
                  const preset = allPresets.find((p) => p.id === presetId);
                  if (!preset) return [];
                  return preset.tagIds.map((tagId) => {
                    const tag = allTagsWithCustom.find((t) => t.id === tagId);
                    return (
                      <span
                        key={`${presetId}-${tagId}`}
                        className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/30 rounded text-[11px] font-semibold"
                      >
                        {tag?.name ?? tagId}
                      </span>
                    );
                  });
                })}
              </div>
            )}
          </div>
        )}

        {/* NG条件（タグ選択） */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">NG条件</label>
          <TagCheckboxGroup
            tags={allTagsWithCustom}
            selectedTagIds={form.selectedTagIds}
            onToggle={toggleTag}
          />
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">重症度</label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <label
                key={c}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer border transition-colors ${
                  form.condition === c
                    ? "bg-primary text-white border-primary"
                    : "bg-bg-cream border-border text-text-secondary hover:border-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value={c}
                  checked={form.condition === c}
                  onChange={() => setForm((prev) => ({ ...prev, condition: c }))}
                  className="sr-only"
                />
                {c}
              </label>
            ))}
          </div>
        </div>

        {/* Contamination */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">コンタミ許容</label>
          <div className="flex flex-wrap gap-2">
            {CONTAMINATIONS.map((c) => (
              <label
                key={c}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer border transition-colors ${
                  form.contamination === c
                    ? "bg-primary text-white border-primary"
                    : "bg-bg-cream border-border text-text-secondary hover:border-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="contamination"
                  value={c}
                  checked={form.contamination === c}
                  onChange={() => setForm((prev) => ({ ...prev, contamination: c }))}
                  className="sr-only"
                />
                {c}
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">自由記述</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="補足情報を入力..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-card placeholder:text-text-muted/50 focus:border-primary/50 resize-y"
          />
        </div>

        {/* Original Text */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">入力原文</label>
          <textarea
            value={form.originalText}
            onChange={(e) => setForm((prev) => ({ ...prev, originalText: e.target.value }))}
            placeholder="顧客からの原文を入力..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-card placeholder:text-text-muted/50 focus:border-primary/50 resize-y"
          />
        </div>

        {/* 選択タグサマリ */}
        {allRestrictions.length > 0 && (
          <div>
            <label className="block text-sm text-text-secondary mb-2">選択タグサマリ</label>
            <TagSummary restrictions={allRestrictions} allTags={allTagsWithCustom} />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-cream transition-colors cursor-pointer"
          >
            キャンセル
          </button>
          <button
            onClick={onSave}
            disabled={!form.name.trim()}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Customer List Page ───
export function CustomerListPage() {
  const navigate = useNavigate();
  const [customerList, setCustomerList] = useCustomers();
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const { items: customItems } = useCustomTags();
  const allTagsWithCustom = useMemo(() => getAllTagsWithCustom(customItems), [customItems]);

  function confirmDelete() {
    if (!deleteTarget) return;
    setCustomerList((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          id="customer-create-btn"
          onClick={() => navigate("/customers/new")}
          className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors cursor-pointer"
        >
          + 新規登録
        </button>
      </div>

      {customerList.length === 0 && (
        <div className="text-center py-12 text-text-muted text-sm">顧客が登録されていません</div>
      )}

      <div
        id="customer-list-section"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {customerList.map((customer) => (
          <div
            key={customer.id}
            className="bg-bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-elevated transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-display font-medium text-base">{customer.name}</h4>
              <span className="text-[11px] px-1.5 py-0.5 bg-bg-cream border border-border-light rounded text-text-muted shrink-0">
                {customer.roomName || "—"}
              </span>
            </div>
            <p className="text-xs text-text-muted mb-2">{customer.checkInDate || "日付未設定"}</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {customer.restrictions.map((r) => {
                const tag = allTagsWithCustom.find((t) => t.id === r.tagId);
                const name = tag?.name ?? r.tagId;
                return (
                  <span
                    key={r.tagId}
                    className={`px-1.5 py-0.5 border rounded text-[11px] font-semibold ${restrictionChipStyle(tag?.category)}`}
                  >
                    {name}
                  </span>
                );
              })}
            </div>
            <div className="flex gap-2 text-[11px] text-text-muted mb-3">
              <span>{customer.condition}</span>
              <span>/ コンタミ: {customer.contamination}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/customers/edit/${customer.id}`)}
                className="px-3 py-1.5 text-xs border border-border rounded-lg text-text-secondary hover:bg-bg-cream transition-colors cursor-pointer"
              >
                編集
              </button>
              <button
                onClick={() => setDeleteTarget(customer)}
                className="px-3 py-1.5 text-xs border border-ng-border text-ng rounded-lg hover:bg-ng-bg transition-colors cursor-pointer"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="顧客を削除">
        <div className="space-y-4">
          <p className="text-sm">
            <span className="font-medium">{deleteTarget?.name}</span>{" "}
            を削除してよろしいですか？この操作は取り消せません。
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-cream transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 text-sm bg-ng text-white rounded-lg hover:bg-ng/80 transition-colors cursor-pointer"
            >
              削除する
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Customer Form Page (New / Edit) ───
export function CustomerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [customerList, setCustomerList] = useCustomers();

  const isEdit = id !== undefined;
  const editCustomer = isEdit ? customerList.find((c) => c.id === Number(id)) : null;

  const [form, setForm] = useState<CustomerForm>(() =>
    editCustomer ? formFromCustomer(editCustomer) : emptyForm(),
  );

  function saveCreate() {
    if (!form.name.trim()) return;
    const newCustomer: Customer = {
      id: customerList.length > 0 ? Math.max(...customerList.map((c) => c.id)) + 1 : 1,
      name: form.name.trim(),
      roomName: form.roomName.trim(),
      checkInDate: form.checkInDate,
      restrictions: buildRestrictions(form.selectedTagIds, form.presets),
      condition: form.condition,
      contamination: form.contamination,
      notes: form.notes,
      originalText: form.originalText,
      presets: form.presets,
    };
    setCustomerList((prev) => [...prev, newCustomer]);
    navigate("/customers");
  }

  function saveEdit() {
    if (!id || !form.name.trim()) return;
    setCustomerList((prev) =>
      prev.map((c) =>
        c.id === Number(id)
          ? {
              ...c,
              name: form.name.trim(),
              roomName: form.roomName.trim(),
              checkInDate: form.checkInDate,
              restrictions: buildRestrictions(form.selectedTagIds, form.presets),
              condition: form.condition,
              contamination: form.contamination,
              notes: form.notes,
              originalText: form.originalText,
              presets: form.presets,
            }
          : c,
      ),
    );
    navigate("/customers");
  }

  if (isEdit && !editCustomer) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">顧客が見つかりません（ID: {id}）</p>
        <button
          onClick={() => navigate("/customers")}
          className="text-sm text-primary hover:text-primary-dark font-medium cursor-pointer"
        >
          ← 一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <CustomerFormView
      form={form}
      setForm={setForm}
      onSave={isEdit ? saveEdit : saveCreate}
      onCancel={() => navigate("/customers")}
      submitLabel={isEdit ? "保存" : "登録"}
    />
  );
}
