import { useEffect, useRef, useState } from "react";
import type { ImportQueueItem, FileType, ImportedIngredient, RawMaterial } from "../data/mock";
import { useImportQueue } from "../hooks/useImportQueue";
import { useImportedIngredients } from "../hooks/useImportedIngredients";
import { useIngredients } from "../hooks/useIngredients";
import { StatusBadge } from "../components/StatusBadge";
import { TagChip } from "../components/TagChip";
import { IngredientDetailModal } from "../components/IngredientDetailModal";
import { findTagByName, findTagById } from "../data/tags";
import { generateRandomIngredients } from "../data/ocrSimulation";
import { convertImportedToIngredient } from "../utils/importToIngredient";
import type { Tag, TagAttachment } from "../data/types";

const filters = ["すべて", "PDF", "画像", "CSV", "Excel"] as const;
type Filter = (typeof filters)[number];

const filterToFileType: Record<Exclude<Filter, "すべて">, FileType> = {
  PDF: "規格書",
  画像: "ラベル",
  CSV: "CSV",
  Excel: "Excel",
};

function guessFileType(fileName: string): FileType {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "規格書";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "ラベル";
  if (ext === "csv") return "CSV";
  if (["xlsx", "xls"].includes(ext)) return "Excel";
  return "CSV";
}

let nextId = 200;

export function ImportPage() {
  const [active, setActive] = useState<Filter>("すべて");
  const [queue, setQueue] = useImportQueue();
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 正規化確認
  const [ingredients, setIngredients] = useImportedIngredients();
  const [savedIngredients, setSavedIngredients] = useIngredients();
  const [detailItem, setDetailItem] = useState<ImportedIngredient | null>(null);
  const [dbSaved, setDbSaved] = useState(false);
  const ocrTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      for (const timer of ocrTimers.current) clearTimeout(timer);
    };
  }, []);

  const displayed =
    active === "すべて"
      ? queue
      : queue.filter((item) => item.fileType === filterToFileType[active]);

  const pendingCount = ingredients.filter((i) => i.status === "要確認").length;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragging(false);
  }

  function addFiles(files: File[]) {
    const newItems: ImportQueueItem[] = files.map((file) => ({
      id: ++nextId,
      fileName: file.name,
      fileType: guessFileType(file.name),
      extractedCount: 0,
      status: "OCR中" as const,
    }));
    setQueue((prev) => [...prev, ...newItems]);

    // OCRシミュレーション: 1秒後にランダム食材を生成
    for (const item of newItems) {
      const timer = setTimeout(() => {
        const count = 1 + Math.floor(Math.random() * 3); // 1-3件
        const generated = generateRandomIngredients(item.fileName, count);

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "抽出済み" as const, extractedCount: count } : q,
          ),
        );
        setIngredients((prev) => [...prev, ...generated]);
      }, 1000);
      ocrTimers.current.push(timer);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) addFiles(files);
    e.target.value = "";
  }

  function completeItem(id: number) {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }

  function cancelItem(id: number) {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }

  function collectTags(
    materials: RawMaterial[],
    itemTags?: TagAttachment[],
  ): { tag: Tag; attachment: TagAttachment }[] {
    const result: { tag: Tag; attachment: TagAttachment }[] = [];
    // アレルゲンタグ（原材料由来）
    const names = [...new Set(materials.flatMap((m) => m.allergens))];
    for (const name of names) {
      const tag = findTagByName(name);
      if (tag) {
        result.push({
          tag,
          attachment: { tagId: tag.id, source: "master", confirmed: true },
        });
      }
    }
    // 非アレルゲンタグ（食材に直接付与）
    if (itemTags) {
      for (const att of itemTags) {
        const tag = findTagById(att.tagId);
        if (tag && !result.some((r) => r.tag.id === tag.id)) {
          result.push({ tag, attachment: att });
        }
      }
    }
    return result;
  }

  function confirmIngredient(id: number) {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "確定" as const } : i)),
    );
  }

  function revertIngredient(id: number) {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "要確認" as const } : i)),
    );
  }

  function updateIngredient(updated: ImportedIngredient) {
    setIngredients((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setDetailItem(updated);
  }

  function saveToDb() {
    const confirmed = ingredients.filter((i) => i.status === "確定");
    const existingIds = new Set(savedIngredients.map((i) => i.id));
    const existingNames = new Set(savedIngredients.map((i) => i.name));

    const newIngredients = confirmed
      .filter((imp) => !existingNames.has(imp.name))
      .map((imp) => {
        const converted = convertImportedToIngredient(imp, existingIds);
        existingIds.add(converted.id);
        return converted;
      });

    if (newIngredients.length > 0) {
      setSavedIngredients((prev) => [...prev, ...newIngredients]);
    }

    // DB反映済みの確定食材をインポートリストから除去
    const confirmedIds = new Set(confirmed.map((i) => i.id));
    setIngredients((prev) => prev.filter((i) => !confirmedIds.has(i.id)));

    setDbSaved(true);
    setTimeout(() => setDbSaved(false), 3000);
  }

  return (
    <div className="space-y-8">
      {/* Upload */}
      <section>
        <h3 className="font-display text-base font-medium text-text-secondary mb-4">
          ファイルアップロード
        </h3>

        <div
          id="import-filter-tabs"
          className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide md:overflow-visible"
        >
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                active === f
                  ? "bg-primary text-white shadow-card"
                  : "bg-bg-card text-text-secondary border border-border hover:border-primary/30"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div
          id="import-upload-area"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 md:p-14 text-center transition-all duration-300 cursor-pointer group ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border bg-bg-cream/60 hover:border-primary/30 hover:bg-bg-cream"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
            {dragging ? "📥" : "📄"}
          </div>
          <p className="text-text-secondary font-medium mb-1">
            {dragging ? "ここにドロップしてアップロード" : "ファイルをドラッグ＆ドロップ"}
          </p>
          <p className="text-text-muted text-sm">
            または <span className="text-primary underline cursor-pointer">参照</span>{" "}
            してアップロード
          </p>
          <p className="text-text-muted text-[11px] mt-3">PDF, JPG, PNG, CSV, XLSX に対応</p>
        </div>
      </section>

      {/* Queue */}
      <section id="import-queue-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-medium text-text-secondary">取込キュー</h3>
          <span className="text-xs text-text-muted">{displayed.length} 件</span>
        </div>

        <div className="bg-bg-card rounded-xl border border-border overflow-hidden shadow-card">
          {/* Mobile card layout */}
          <div className="md:hidden divide-y divide-border-light">
            {displayed.map((row) => (
              <div key={row.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate mr-2">{row.fileName}</span>
                  <StatusBadge value={row.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>#{row.id}</span>
                  <span>{row.fileType}</span>
                  <span>抽出: {row.extractedCount || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {row.status === "抽出済み" && (
                    <button
                      onClick={() => completeItem(row.id)}
                      className="text-xs text-ok hover:text-ok/80 font-medium cursor-pointer"
                    >
                      完了 ✓
                    </button>
                  )}
                  {row.status === "OCR中" && (
                    <button className="text-xs text-text-muted hover:text-text-secondary font-medium cursor-pointer">
                      再実行
                    </button>
                  )}
                  {row.status === "エラー" && (
                    <button className="text-xs text-ng hover:text-ng/80 font-medium cursor-pointer">
                      再試行
                    </button>
                  )}
                  {row.status !== "取込完了" && row.status !== "抽出済み" && (
                    <button
                      onClick={() => cancelItem(row.id)}
                      className="text-xs text-text-muted hover:text-ng font-medium cursor-pointer"
                    >
                      キャンセル
                    </button>
                  )}
                </div>
              </div>
            ))}
            {displayed.length === 0 && (
              <div className="py-8 text-center text-sm text-text-muted">
                該当するファイルがありません
              </div>
            )}
          </div>
          {/* Desktop table layout */}
          <table className="w-full hidden md:table">
            <thead>
              <tr className="border-b border-border bg-bg-cream/40">
                {["ID", "ファイル名", "種別", "抽出件数", "状態", "操作"].map((h, i) => (
                  <th
                    key={h}
                    className={`py-3 px-4 text-[11px] font-semibold text-text-muted uppercase tracking-wider ${
                      i === 3 ? "text-right" : i >= 4 ? "text-center" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border-light last:border-0 hover:bg-bg-cream/30 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-text-muted tabular-nums">{row.id}</td>
                  <td className="py-3 px-4 text-sm font-medium">{row.fileName}</td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{row.fileType}</td>
                  <td className="py-3 px-4 text-sm text-right tabular-nums">
                    {row.extractedCount || "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge value={row.status} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {row.status === "抽出済み" && (
                        <button
                          onClick={() => completeItem(row.id)}
                          className="text-xs text-ok hover:text-ok/80 font-medium cursor-pointer"
                        >
                          完了 ✓
                        </button>
                      )}
                      {row.status === "OCR中" && (
                        <button className="text-xs text-text-muted hover:text-text-secondary font-medium cursor-pointer">
                          再実行
                        </button>
                      )}
                      {row.status === "エラー" && (
                        <button className="text-xs text-ng hover:text-ng/80 font-medium cursor-pointer">
                          再試行
                        </button>
                      )}
                      {row.status !== "取込完了" && row.status !== "抽出済み" && (
                        <button
                          onClick={() => cancelItem(row.id)}
                          className="text-xs text-text-muted hover:text-ng font-medium cursor-pointer"
                        >
                          キャンセル
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-text-muted">
                    該当するファイルがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Normalization */}
      <section id="import-normalize-section" className="space-y-6">
        <h3 className="font-display text-base font-medium text-text-secondary">正規化確認</h3>

        {/* Summary */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-caution-bg border border-caution-border rounded-lg text-sm text-caution">
            <span className="text-base">⚠</span>
            未確定: <strong>{pendingCount}件</strong>
          </div>
        )}

        {/* DB saved message */}
        {dbSaved && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-ok-bg border border-ok-border rounded-lg text-sm text-ok animate-fade-in">
            <span className="text-base">✓</span>
            DBに反映しました
          </div>
        )}

        {/* Table */}
        <div className="bg-bg-card rounded-xl border border-border overflow-hidden shadow-card">
          {/* Mobile card layout */}
          <div className="md:hidden divide-y divide-border-light">
            {ingredients.map((row) => {
              const chips = collectTags(row.rawMaterials, row.tags);
              return (
                <div
                  key={row.id}
                  className="px-4 py-3 space-y-2 cursor-pointer hover:bg-bg-cream/30 transition-colors"
                  onClick={() => setDetailItem(row)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{row.name}</span>
                    <StatusBadge value={row.status} />
                  </div>
                  <div className="text-xs text-text-muted">{row.sourceFile}</div>
                  <div className="text-xs text-text-secondary">
                    {row.rawMaterials.map((m) => m.name).join(", ")}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {chips.length === 0 ? (
                      <span className="text-xs text-text-muted">—</span>
                    ) : (
                      chips.map(({ tag, attachment }) => (
                        <TagChip key={tag.id} tag={tag} attachment={attachment} />
                      ))
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {row.status === "要確認" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmIngredient(row.id);
                        }}
                        className="text-xs font-medium text-ok hover:text-ok/80 cursor-pointer"
                      >
                        確定 ✓
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          revertIngredient(row.id);
                        }}
                        className="text-xs font-medium text-text-muted hover:text-text-secondary cursor-pointer"
                      >
                        戻す
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Desktop table layout */}
          <table className="w-full hidden md:table">
            <thead>
              <tr className="border-b border-border bg-bg-cream/40">
                {["出典ファイル", "仕入れ食材名", "原材料", "タグ", "状態", "操作"].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-4 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ingredients.map((row) => {
                const chips = collectTags(row.rawMaterials, row.tags);
                const rawNames = row.rawMaterials.map((m) => m.name).join(", ");
                return (
                  <tr
                    key={row.id}
                    className="border-b border-border-light last:border-0 hover:bg-bg-cream/30 transition-colors cursor-pointer"
                    onClick={() => setDetailItem(row)}
                  >
                    <td className="py-3 px-4 text-sm text-text-muted">{row.sourceFile}</td>
                    <td className="py-3 px-4 text-sm font-medium">{row.name}</td>
                    <td className="py-3 px-4 text-sm text-text-secondary max-w-[200px]">
                      <span className="line-clamp-2" title={rawNames}>
                        {rawNames}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {chips.length === 0 ? (
                          <span className="text-xs text-text-muted">—</span>
                        ) : (
                          chips.map(({ tag, attachment }) => (
                            <TagChip key={tag.id} tag={tag} attachment={attachment} />
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge value={row.status} />
                    </td>
                    <td className="py-3 px-4">
                      {row.status === "要確認" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmIngredient(row.id);
                          }}
                          className="text-xs font-medium text-ok hover:text-ok/80 cursor-pointer"
                        >
                          確定 ✓
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            revertIngredient(row.id);
                          }}
                          className="text-xs font-medium text-text-muted hover:text-text-secondary cursor-pointer"
                        >
                          戻す
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={saveToDb}
            className="px-5 py-2.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={ingredients.length === 0 || pendingCount > 0}
          >
            DB反映
          </button>
        </div>

        {/* Detail Modal */}
        <IngredientDetailModal
          item={detailItem}
          open={detailItem !== null}
          onClose={() => setDetailItem(null)}
          onUpdate={updateIngredient}
        />
      </section>
    </div>
  );
}
