import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { TourHelpButton } from "../tour/TourHelpButton";
import { useTour } from "../tour/useTour";
import { useTourCompleted } from "../tour/useTourCompleted";
import { welcomeTour } from "../tour/steps";
import type { Step } from "./Sidebar";

type Props = {
  steps: Step[];
};

const UTILITY_TITLES: Record<string, string> = {
  "/dashboard": "ダッシュボード",
  "/kitchen": "厨房連携",
  "/ingredients": "食材マスタ",
  "/allergens": "アレルゲン・タグ管理",
  "/customers": "顧客管理",
};

export function Layout({ steps }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { startTour, activeTour } = useTour();
  const { isCompleted } = useTourCompleted();

  useEffect(() => {
    if (!isCompleted("welcome") && !activeTour) {
      const timer = setTimeout(() => startTour(welcomeTour), 500);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentIndex = steps.findIndex((s) => s.path === location.pathname);
  const isStepPage = currentIndex >= 0;
  const currentStep = isStepPage ? steps[currentIndex] : null;
  const stepNumber = isStepPage ? currentIndex + 1 : 0;
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex === steps.length - 1;
  const utilityTitle = Object.entries(UTILITY_TITLES).find(([prefix]) =>
    location.pathname.startsWith(prefix),
  )?.[1];

  return (
    <div className="flex flex-col h-screen md:flex-row md:overflow-hidden">
      <div className="hidden md:flex shrink-0">
        <Sidebar steps={steps} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="shrink-0 bg-bg-card border-b border-border px-4 py-3 md:px-8 md:py-4 flex items-center justify-between">
          <div>
            {isStepPage && currentStep ? (
              <>
                <p className="text-[11px] text-text-muted tracking-wider mb-0.5">
                  STEP {stepNumber} / {steps.length}
                </p>
                <h2 className="font-display text-base md:text-xl font-medium tracking-wide">
                  {currentStep.label}
                </h2>
              </>
            ) : (
              <h2 className="font-display text-base md:text-xl font-medium tracking-wide">
                {utilityTitle ?? ""}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isStepPage && (
              <div className="hidden sm:flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={() => navigate(steps[currentIndex - 1].path)}
                    className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-cream transition-colors cursor-pointer"
                  >
                    ← 前へ
                  </button>
                )}
                {!isLast && (
                  <button
                    onClick={() => navigate(steps[currentIndex + 1].path)}
                    className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors cursor-pointer"
                  >
                    次へ: {steps[currentIndex + 1]?.label} →
                  </button>
                )}
              </div>
            )}
            <TourHelpButton />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 pb-24 md:px-8 md:py-6 md:pb-6">
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileBottomNav steps={steps} />
    </div>
  );
}
