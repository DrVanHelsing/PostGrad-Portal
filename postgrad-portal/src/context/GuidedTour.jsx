// ============================================
// PostGrad Portal – Guided Tour Context & Engine
// ============================================
// Provides an overlay-based walkthrough system that highlights
// UI elements, shows step instructions, auto-scrolls, and
// navigates between pages.

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineCursorArrowRays,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import './GuidedTour.css';

const TourContext = createContext(null);

/* ─── Tour Provider ─── */
export function TourProvider({ children }) {
  const [activeTour, setActiveTour] = useState(null); // { id, steps }
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const waitingForRoute = useRef(false);
  const resizeTimer = useRef(null);

  const currentStep = activeTour?.steps?.[stepIndex] || null;
  const totalSteps = activeTour?.steps?.length || 0;

  /* ── Position the highlight + tooltip around a target element ── */
  const positionStep = useCallback((step) => {
    if (!step) { setHighlightRect(null); setTooltipPos(null); return; }

    // If step has no selector, show centered modal
    if (!step.selector) {
      setHighlightRect(null);
      setTooltipPos({ type: 'center' });
      return;
    }

    const el = document.querySelector(step.selector);
    if (!el) {
      // Element not found — try again after a short delay (DOM may still be rendering)
      setTimeout(() => {
        const retry = document.querySelector(step.selector);
        if (retry) {
          positionElement(retry, step);
        } else {
          // fallback: show centered
          setHighlightRect(null);
          setTooltipPos({ type: 'center' });
        }
      }, 400);
      return;
    }

    positionElement(el, step);
  }, []);

  const positionElement = useCallback((el, step) => {
    // Auto-scroll to element
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

    // Wait for scroll to settle
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const pad = 6;
      setHighlightRect({
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      });

      // Tooltip positioning
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const tooltipW = 360;
      const tooltipH = 200;
      const preferred = step.tooltipPosition || 'bottom';

      let pos = {};
      if (preferred === 'bottom' && rect.bottom + tooltipH + 20 < vh) {
        pos = { type: 'bottom', top: rect.bottom + 14, left: Math.max(12, Math.min(rect.left, vw - tooltipW - 12)) };
      } else if (preferred === 'top' && rect.top - tooltipH - 20 > 0) {
        pos = { type: 'top', top: rect.top - tooltipH - 14, left: Math.max(12, Math.min(rect.left, vw - tooltipW - 12)) };
      } else if (preferred === 'right' && rect.right + tooltipW + 20 < vw) {
        pos = { type: 'right', top: Math.max(12, rect.top), left: rect.right + 14 };
      } else if (preferred === 'left' && rect.left - tooltipW - 20 > 0) {
        pos = { type: 'left', top: Math.max(12, rect.top), left: rect.left - tooltipW - 14 };
      } else {
        // Default: below or center
        if (rect.bottom + tooltipH + 20 < vh) {
          pos = { type: 'bottom', top: rect.bottom + 14, left: Math.max(12, Math.min(rect.left, vw - tooltipW - 12)) };
        } else {
          pos = { type: 'top', top: Math.max(12, rect.top - tooltipH - 14), left: Math.max(12, Math.min(rect.left, vw - tooltipW - 12)) };
        }
      }

      setTooltipPos(pos);
    }, 350);
  }, []);

  /* ── Navigate when step requires a different route ── */
  useEffect(() => {
    if (!currentStep) return;
    if (currentStep.route && location.pathname !== currentStep.route) {
      waitingForRoute.current = true;
      navigate(currentStep.route);
    } else {
      waitingForRoute.current = false;
      positionStep(currentStep);
    }
  }, [currentStep, location.pathname, navigate, positionStep]);

  /* ── Re-position on route change (for waiting steps) ── */
  useEffect(() => {
    if (waitingForRoute.current && currentStep) {
      const t = setTimeout(() => positionStep(currentStep), 500);
      return () => clearTimeout(t);
    }
  }, [location.pathname, currentStep, positionStep]);

  /* ── Re-position on window resize ── */
  useEffect(() => {
    if (!activeTour) return;
    const handleResize = () => {
      clearTimeout(resizeTimer.current);
      resizeTimer.current = setTimeout(() => positionStep(currentStep), 200);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTour, currentStep, positionStep]);

  /* ── Public API ── */
  const startTour = useCallback((tour) => {
    setActiveTour(tour);
    setStepIndex(0);
  }, []);

  const endTour = useCallback(() => {
    setActiveTour(null);
    setStepIndex(0);
    setHighlightRect(null);
    setTooltipPos(null);
  }, []);

  const nextStep = useCallback(() => {
    if (stepIndex < totalSteps - 1) {
      setStepIndex(prev => prev + 1);
    } else {
      endTour();
    }
  }, [stepIndex, totalSteps, endTour]);

  const prevStep = useCallback(() => {
    if (stepIndex > 0) setStepIndex(prev => prev - 1);
  }, [stepIndex]);

  const goToStep = useCallback((i) => {
    if (i >= 0 && i < totalSteps) setStepIndex(i);
  }, [totalSteps]);

  /* ── Handle "click target to proceed" steps ── */
  useEffect(() => {
    if (!currentStep?.clickToProceed || !currentStep?.selector) return;

    // If this step targets a sidebar nav link and we're already on the target route,
    // auto-advance after a short delay instead of waiting for a click that won't navigate
    if (currentStep.route && location.pathname === currentStep.route) {
      const el = document.querySelector(currentStep.selector);
      if (el && el.classList.contains('active')) {
        const timer = setTimeout(() => nextStep(), 600);
        return () => clearTimeout(timer);
      }
    }

    const el = document.querySelector(currentStep.selector);
    if (!el) return;
    const handler = () => {
      setTimeout(() => nextStep(), 300);
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [currentStep, nextStep, location.pathname]);

  return (
    <TourContext.Provider value={{ activeTour, currentStep, stepIndex, totalSteps, startTour, endTour, nextStep, prevStep, goToStep }}>
      {children}
      {activeTour && createPortal(
        <TourOverlay
          highlightRect={highlightRect}
          tooltipPos={tooltipPos}
          step={currentStep}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          onNext={nextStep}
          onPrev={prevStep}
          onEnd={endTour}
        />,
        document.body
      )}
    </TourContext.Provider>
  );
}

/* ─── Overlay Component ─── */
function TourOverlay({ highlightRect, tooltipPos, step, stepIndex, totalSteps, onNext, onPrev, onEnd }) {
  if (!step) return null;

  const isLast = stepIndex === totalSteps - 1;
  const isFirst = stepIndex === 0;

  return (
    <div className="tour-overlay">
      {/* Dark backdrop with cutout */}
      <svg className="tour-backdrop" viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`} preserveAspectRatio="none">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlightRect && (
              <rect
                x={highlightRect.left}
                y={highlightRect.top}
                width={highlightRect.width}
                height={highlightRect.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#tour-mask)" />
      </svg>

      {/* Highlight ring */}
      {highlightRect && (
        <div
          className="tour-highlight-ring"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipPos && (
        <div
          className={`tour-tooltip tour-tooltip-${tooltipPos.type}`}
          style={
            tooltipPos.type === 'center'
              ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
              : { top: tooltipPos.top, left: tooltipPos.left }
          }
        >
          {/* Step counter */}
          <div className="tour-tooltip-counter">
            Step {stepIndex + 1} of {totalSteps}
          </div>

          {/* Title */}
          {step.title && <h3 className="tour-tooltip-title">{step.title}</h3>}

          {/* Content */}
          <div className="tour-tooltip-content">
            {step.content}
          </div>

          {/* Click hint */}
          {step.clickToProceed && (
            <div className="tour-tooltip-hint">
              <HiOutlineCursorArrowRays /> Click the highlighted element to continue
            </div>
          )}

          {/* Navigation */}
          <div className="tour-tooltip-nav">
            <button className="tour-btn tour-btn-ghost" onClick={onEnd}>
              {isLast ? 'Finish' : 'Exit tour'}
            </button>
            <div className="tour-tooltip-nav-right">
              {!isFirst && (
                <button className="tour-btn tour-btn-secondary" onClick={onPrev}>
                  <HiOutlineArrowLeft /> Back
                </button>
              )}
              {!step.clickToProceed && (
                <button className="tour-btn tour-btn-primary" onClick={onNext}>
                  {isLast ? <><HiOutlineCheckCircle /> Done</> : <>Next <HiOutlineArrowRight /></>}
                </button>
              )}
            </div>
          </div>

          {/* Progress dots */}
          <div className="tour-progress">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className={`tour-progress-dot ${i === stepIndex ? 'active' : ''} ${i < stepIndex ? 'completed' : ''}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}
