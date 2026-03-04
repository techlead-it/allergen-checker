import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAssignments } from "../hooks/useAssignments";
import { useCustomers } from "../hooks/useCustomers";
import { useCourses } from "../hooks/useCourses";
import { useRecipes } from "../hooks/useRecipes";
import { checkDishByTags, buildDishIngredients } from "../utils/tagCheck";
import { allTags, cookingStateRules } from "../data/tags";
import { StatusBadge } from "../components/StatusBadge";
import { SearchableSelect } from "../components/SearchableSelect";
import { Modal } from "../components/Modal";
import { ConfirmModal } from "../components/ConfirmModal";
import type { AssignmentStatus, CustomerCourseAssignment, Recipe } from "../data/types";

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useAssignments();
  const [customers] = useCustomers();
  const [courseList] = useCourses();
  const [allRecipes] = useRecipes();

  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<AssignmentStatus | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState<number>(0);
  const [newCourseId, setNewCourseId] = useState<number>(0);
  const [newDate, setNewDate] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  function getCounts(assignment: CustomerCourseAssignment) {
    const customer = customers.find((c) => c.id === assignment.customerId);
    const course = courseList.find((c) => c.id === assignment.courseId);
    if (!customer || !course) return { OK: 0, NG: 0, 要確認: 0 };

    const dishes = course.dishIds
      .map((id) => allRecipes.find((r) => r.id === id))
      .filter((r): r is Recipe => r !== undefined);

    const counts = { OK: 0, NG: 0, 要確認: 0 };
    for (const dish of dishes) {
      const dishIngredients = buildDishIngredients(dish);
      const result = checkDishByTags(
        dishIngredients,
        customer.restrictions,
        allTags,
        cookingStateRules,
      );
      counts[result.judgment]++;
    }
    return counts;
  }

  const filtered = assignments.filter((a) => {
    if (filterDate && a.date !== filterDate) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.name,
    sub: `${c.roomName} / ${c.checkInDate}`,
  }));

  const courseOptions = courseList.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  function handleCreate() {
    if (!newCustomerId || !newCourseId || !newDate) return;
    const newId = assignments.length > 0 ? Math.max(...assignments.map((a) => a.id)) + 1 : 1;
    const newAssignment: CustomerCourseAssignment = {
      id: newId,
      customerId: newCustomerId,
      courseId: newCourseId,
      date: newDate,
      customizations: [],
      kitchenNote: "",
      status: "未確認",
    };
    setAssignments((prev) => [...prev, newAssignment]);
    setModalOpen(false);
    setNewCustomerId(0);
    setNewCourseId(0);
    setNewDate("");
    navigate(`/dashboard/${newId}`);
  }

  function openModal() {
    setNewCustomerId(customers[0]?.id ?? 0);
    setNewCourseId(courseList[0]?.id ?? 0);
    setNewDate(new Date().toISOString().slice(0, 10));
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* フィルタ＋新規ボタン */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div id="dashboard-filters" className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            日付:
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 border border-border rounded-lg text-sm bg-bg-card focus:border-primary/50 focus:shadow-card outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            ステータス:
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AssignmentStatus | "")}
              className="px-3 py-1.5 border border-border rounded-lg text-sm bg-bg-card focus:border-primary/50 focus:shadow-card outline-none cursor-pointer"
            >
              <option value="">全て</option>
              <option value="未確認">未確認</option>
              <option value="確認済">確認済</option>
              <option value="厨房共有済">厨房共有済</option>
            </select>
          </label>
          {filterDate && (
            <button
              onClick={() => setFilterDate("")}
              className="text-xs text-text-muted hover:text-text transition-colors cursor-pointer"
            >
              日付クリア
            </button>
          )}
        </div>
        <button
          id="dashboard-create-btn"
          onClick={openModal}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-light transition-colors cursor-pointer shrink-0"
        >
          + 新規割当
        </button>
      </div>

      {/* テーブル（デスクトップ） */}
      <div
        id="dashboard-table"
        className="bg-bg-card border border-border rounded-xl shadow-card overflow-hidden"
      >
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-text-muted text-sm">
            {assignments.length === 0
              ? "割当がありません。「+ 新規割当」から作成してください。"
              : "条件に一致する割当がありません。"}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full hidden md:table">
              <thead>
                <tr className="bg-bg-cream/40 border-b border-border">
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-left">
                    顧客名
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-left">
                    部屋
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-left">
                    コース
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-center">
                    日付
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-center">
                    OK
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-center">
                    NG
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-center">
                    ?
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-center">
                    状態
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-text-muted uppercase tracking-wider text-center">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const customer = customers.find((c) => c.id === a.customerId);
                  const course = courseList.find((c) => c.id === a.courseId);
                  const counts = getCounts(a);
                  return (
                    <tr
                      key={a.id}
                      onClick={() => navigate(`/dashboard/${a.id}`)}
                      className="border-t border-border-light hover:bg-bg-cream/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-sm font-medium">{customer?.name ?? "—"}</td>
                      <td className="py-3 px-4 text-sm text-text-secondary">
                        {customer?.roomName ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-text-secondary">
                        {course?.name ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-center">{formatDateShort(a.date)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-ok font-semibold text-sm">{counts.OK}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-ng font-semibold text-sm">{counts.NG}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-caution font-semibold text-sm">{counts.要確認}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge value={a.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(a.id);
                          }}
                          className="text-xs text-text-muted hover:text-ng transition-colors cursor-pointer"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile card layout */}
            <div className="md:hidden divide-y divide-border-light">
              {filtered.map((a) => {
                const customer = customers.find((c) => c.id === a.customerId);
                const course = courseList.find((c) => c.id === a.courseId);
                const counts = getCounts(a);
                return (
                  <div key={a.id} className="px-4 py-3 hover:bg-bg-cream/30 transition-colors">
                    <button
                      onClick={() => navigate(`/dashboard/${a.id}`)}
                      className="w-full text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{customer?.name ?? "—"}</span>
                        <StatusBadge value={a.status} />
                      </div>
                      <div className="text-xs text-text-muted mb-2">
                        {course?.name ?? "—"} / {formatDateShort(a.date)}
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="text-ok font-semibold">OK {counts.OK}</span>
                        <span className="text-ng font-semibold">NG {counts.NG}</span>
                        <span className="text-caution font-semibold">? {counts.要確認}</span>
                      </div>
                    </button>
                    <div className="flex justify-end mt-1">
                      <button
                        onClick={() => setDeleteTargetId(a.id)}
                        className="text-xs text-text-muted hover:text-ng transition-colors cursor-pointer"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 新規割当モーダル */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="新規割当" allowOverflow>
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-text-secondary mb-1 block">顧客</span>
            <SearchableSelect
              options={customerOptions}
              value={newCustomerId}
              onChange={(v) => setNewCustomerId(v as number)}
            />
          </div>
          <div>
            <span className="text-sm font-medium text-text-secondary mb-1 block">コース</span>
            <SearchableSelect
              options={courseOptions}
              value={newCourseId}
              onChange={(v) => setNewCourseId(v as number)}
            />
          </div>
          <label className="block">
            <span className="text-sm font-medium text-text-secondary mb-1 block">提供日</span>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-card focus:border-primary/50 focus:shadow-card outline-none"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-cream transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              onClick={handleCreate}
              disabled={!newCustomerId || !newCourseId || !newDate}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              作成
            </button>
          </div>
        </div>
      </Modal>

      {/* 削除確認モーダル */}
      <ConfirmModal
        open={deleteTargetId != null}
        title="割当の削除"
        message={`${customers.find((c) => c.id === assignments.find((a) => a.id === deleteTargetId)?.customerId)?.name ?? "この"}の割当を削除しますか？この操作は元に戻せません。`}
        confirmLabel="削除"
        variant="danger"
        onConfirm={() => {
          setAssignments((prev) => prev.filter((x) => x.id !== deleteTargetId));
          setDeleteTargetId(null);
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
