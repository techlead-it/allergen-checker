import { useLocation, useNavigate } from "react-router-dom";

export type Step = {
  id: number;
  label: string;
  path: string;
};

type Props = {
  steps: Step[];
};

export function Sidebar({ steps }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentIndex = steps.findIndex((s) => s.path === location.pathname);
  const isAllergenPage = location.pathname === "/allergens";
  const isIngredientPage = location.pathname === "/ingredients";
  const isCustomerPage = location.pathname.startsWith("/customers");
  const isDashboardPage = location.pathname.startsWith("/dashboard");
  const isKitchenPage = location.pathname === "/kitchen";

  return (
    <aside className="w-60 shrink-0 bg-primary-dark text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 pt-7 pb-5 border-b border-white/10">
        <p className="font-display text-[11px] tracking-[0.25em] text-white/50 mb-1">
          ALLERGEN CHECKER
        </p>
      </div>

      {/* Steps */}
      <nav id="sidebar-steps" className="flex-1 px-3 py-5">
        <ul className="space-y-0.5">
          {steps.map((step, idx) => {
            const isActive = idx === currentIndex;
            const isCompleted = idx < currentIndex;
            return (
              <li key={step.id}>
                <button
                  onClick={() => navigate(step.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-white/12 text-white font-semibold"
                      : isCompleted
                        ? "text-white/65 hover:bg-white/6 hover:text-white/80"
                        : "text-white/35 hover:bg-white/4 hover:text-white/50"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0 transition-all duration-200 ${
                      isActive
                        ? "bg-white text-primary-dark"
                        : isCompleted
                          ? "border border-white/40 text-white/70"
                          : "border border-white/15 text-white/30"
                    }`}
                  >
                    {isCompleted ? "✓" : step.id}
                  </span>
                  <span className="truncate">{step.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Utility links */}
        <div className="mt-4 pt-4 border-t border-white/10 space-y-0.5">
          <button
            id="sidebar-dashboard"
            onClick={() => navigate("/dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-200 cursor-pointer ${
              isDashboardPage
                ? "bg-white/12 text-white font-semibold"
                : "text-white/50 hover:bg-white/6 hover:text-white/70"
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
            <span className="truncate">ダッシュボード</span>
          </button>
          <button
            id="sidebar-kitchen"
            onClick={() => navigate("/kitchen")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-200 cursor-pointer ${
              isKitchenPage
                ? "bg-white/12 text-white font-semibold"
                : "text-white/50 hover:bg-white/6 hover:text-white/70"
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
            <span className="truncate">厨房連携</span>
          </button>
          <button
            id="sidebar-customers"
            onClick={() => navigate("/customers")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-200 cursor-pointer ${
              isCustomerPage
                ? "bg-white/12 text-white font-semibold"
                : "text-white/50 hover:bg-white/6 hover:text-white/70"
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
            <span className="truncate">顧客管理</span>
          </button>
          <button
            id="sidebar-ingredients"
            onClick={() => navigate("/ingredients")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-200 cursor-pointer ${
              isIngredientPage
                ? "bg-white/12 text-white font-semibold"
                : "text-white/50 hover:bg-white/6 hover:text-white/70"
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
            <span className="truncate">食材マスタ</span>
          </button>
          <button
            id="sidebar-allergens"
            onClick={() => navigate("/allergens")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-200 cursor-pointer ${
              isAllergenPage
                ? "bg-white/12 text-white font-semibold"
                : "text-white/50 hover:bg-white/6 hover:text-white/70"
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
            <span className="truncate">アレルゲン・タグ管理</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/8 text-[10px] text-white/25 tracking-wider">
        MVP v0.1.0
      </div>
    </aside>
  );
}
