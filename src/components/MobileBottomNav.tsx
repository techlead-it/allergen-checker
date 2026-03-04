import { useLocation, useNavigate } from "react-router-dom";
import type { Step } from "./Sidebar";

type Props = {
  steps: Step[];
};

export function MobileBottomNav({ steps }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentIndex = steps.findIndex((s) => s.path === location.pathname);
  const isAllergenPage = location.pathname === "/allergens";
  const isIngredientPage = location.pathname === "/ingredients";
  const isCustomerPage = location.pathname.startsWith("/customers");
  const isDashboardPage = location.pathname.startsWith("/dashboard");
  const isKitchenPage = location.pathname === "/kitchen";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-primary-dark safe-area-bottom md:hidden animate-slide-up">
      <div className="flex">
        {steps.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isCompleted = idx < currentIndex;
          return (
            <button
              key={step.id}
              onClick={() => navigate(step.path)}
              className={`flex-1 flex flex-col items-center justify-center min-h-[56px] gap-1 transition-colors cursor-pointer ${
                isActive
                  ? "bg-white/10 text-white"
                  : isCompleted
                    ? "text-white/60"
                    : "text-white/35"
              }`}
            >
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0 ${
                  isActive
                    ? "bg-white text-primary-dark"
                    : isCompleted
                      ? "border border-white/40 text-white/70"
                      : "border border-white/15 text-white/30"
                }`}
              >
                {isCompleted ? "✓" : step.id}
              </span>
              <span className="text-[10px] truncate max-w-full px-1">{step.label}</span>
            </button>
          );
        })}
        {/* Utility: ダッシュボード */}
        <button
          onClick={() => navigate("/dashboard")}
          className={`flex-1 flex flex-col items-center justify-center min-h-[56px] gap-1 transition-colors cursor-pointer ${
            isDashboardPage ? "bg-white/10 text-white" : "text-white/35"
          }`}
        >
          <svg
            className="w-5 h-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span className="text-[10px] truncate max-w-full px-1">一覧</span>
        </button>
        {/* Utility: 厨房連携 */}
        <button
          onClick={() => navigate("/kitchen")}
          className={`flex-1 flex flex-col items-center justify-center min-h-[56px] gap-1 transition-colors cursor-pointer ${
            isKitchenPage ? "bg-white/10 text-white" : "text-white/35"
          }`}
        >
          <svg
            className="w-5 h-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 2H9v2H7v4h10V4h-2V2z" />
            <path d="M3 10h18v2H3z" />
            <path d="M5 12v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" />
          </svg>
          <span className="text-[10px] truncate max-w-full px-1">厨房</span>
        </button>
        {/* Utility: 食材マスタ */}
        <button
          onClick={() => navigate("/ingredients")}
          className={`flex-1 flex flex-col items-center justify-center min-h-[56px] gap-1 transition-colors cursor-pointer ${
            isIngredientPage ? "bg-white/10 text-white" : "text-white/35"
          }`}
        >
          <svg
            className="w-5 h-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span className="text-[10px] truncate max-w-full px-1">食材</span>
        </button>
        {/* Utility: 顧客管理 */}
        <button
          onClick={() => navigate("/customers")}
          className={`flex-1 flex flex-col items-center justify-center min-h-[56px] gap-1 transition-colors cursor-pointer ${
            isCustomerPage ? "bg-white/10 text-white" : "text-white/35"
          }`}
        >
          <svg
            className="w-5 h-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[10px] truncate max-w-full px-1">顧客</span>
        </button>
        {/* Utility: アレルゲン管理 */}
        <button
          onClick={() => navigate("/allergens")}
          className={`flex-1 flex flex-col items-center justify-center min-h-[56px] gap-1 transition-colors cursor-pointer ${
            isAllergenPage ? "bg-white/10 text-white" : "text-white/35"
          }`}
        >
          <svg
            className="w-5 h-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="text-[10px] truncate max-w-full px-1">管理</span>
        </button>
      </div>
    </nav>
  );
}
