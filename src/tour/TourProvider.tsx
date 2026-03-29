import { createContext, useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { Tour, TourStep } from "./types";
import { useTourCompleted } from "./useTourCompleted";
import { TourOverlay } from "./TourOverlay";
import { TourTooltip } from "./TourTooltip";

export type TourContextValue = {
  activeTour: Tour | null;
  currentStepIndex: number;
  currentStep: TourStep | null;
  totalSteps: number;
  startTour: (tour: Tour) => void;
  nextStep: () => void;
  prevStep: () => void;
  closeTour: () => void;
};

export const TourContext = createContext<TourContextValue | null>(null);

function waitForElement(selector: string, timeout = 3000): Promise<Element | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) {
      resolve(el);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      const found = document.querySelector(selector);
      if (found) {
        clearInterval(id);
        resolve(found);
      } else if (Date.now() - start > timeout) {
        clearInterval(id);
        resolve(null);
      }
    }, 50);
  });
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetEl, setTargetEl] = useState<Element | null>(null);
  const navigate = useNavigate();
  const { markCompleted } = useTourCompleted();
  const navigatingRef = useRef(false);

  const currentStep = activeTour ? (activeTour.steps[stepIndex] ?? null) : null;
  const totalSteps = activeTour?.steps.length ?? 0;

  const resolveTarget = useCallback(async (step: TourStep): Promise<Element | null> => {
    if (!step.selector) {
      return null;
    }
    const el = await waitForElement(step.selector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // スクロール完了を待ってから位置を確定
      await new Promise((r) => setTimeout(r, 350));
    }
    return el;
  }, []);

  const goToStep = useCallback(
    async (tour: Tour, index: number, route?: string) => {
      if (index < 0 || index >= tour.steps.length) return;
      navigatingRef.current = true;
      if (route) {
        void navigate(route);
        // 遷移後にDOMの準備を待つ
        await new Promise((r) => requestAnimationFrame(r));
      }
      const step = tour.steps[index];
      // モバイルでサイドバー系ステップはスキップ
      if (window.innerWidth < 768 && step.selector?.startsWith("#sidebar-")) {
        navigatingRef.current = false;
        const nextIdx = index + 1;
        if (nextIdx < tour.steps.length) {
          void goToStep(tour, nextIdx, tour.steps[nextIdx].nextRoute);
        }
        return;
      }
      const el = await resolveTarget(step);
      // 同時に更新 → React 18+が1回のレンダリングにバッチ
      setActiveTour(tour);
      setStepIndex(index);
      setTargetEl(el);
      navigatingRef.current = false;
    },
    [navigate, resolveTarget],
  );

  const startTour = useCallback(
    (tour: Tour) => {
      void goToStep(tour, 0);
    },
    [goToStep],
  );

  const nextStep = useCallback(() => {
    if (!activeTour || navigatingRef.current) return;
    const nextIdx = stepIndex + 1;
    if (nextIdx >= activeTour.steps.length) {
      markCompleted(activeTour.name);
      setActiveTour(null);
      setStepIndex(0);
      setTargetEl(null);
      return;
    }
    const nextRoute = activeTour.steps[stepIndex].nextRoute;
    void goToStep(activeTour, nextIdx, nextRoute);
  }, [activeTour, stepIndex, goToStep, markCompleted]);

  const prevStep = useCallback(() => {
    if (!activeTour || navigatingRef.current) return;
    const prevIdx = stepIndex - 1;
    if (prevIdx < 0) return;
    const prevRoute = activeTour.steps[stepIndex].prevRoute;
    void goToStep(activeTour, prevIdx, prevRoute);
  }, [activeTour, stepIndex, goToStep]);

  const closeTour = useCallback(() => {
    if (activeTour) {
      markCompleted(activeTour.name);
    }
    setActiveTour(null);
    setStepIndex(0);
    setTargetEl(null);
  }, [activeTour, markCompleted]);

  return (
    <TourContext.Provider
      value={{
        activeTour,
        currentStepIndex: stepIndex,
        currentStep,
        totalSteps,
        startTour,
        nextStep,
        prevStep,
        closeTour,
      }}
    >
      {children}
      {activeTour && currentStep && (
        <>
          <TourOverlay targetEl={targetEl} padding={currentStep.highlightPadding ?? 8} />
          <TourTooltip
            step={currentStep}
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            targetEl={targetEl}
            onNext={nextStep}
            onPrev={prevStep}
            onClose={closeTour}
          />
        </>
      )}
    </TourContext.Provider>
  );
}
