"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export const TOUR_DONE = "kudi-tour-done-v1";
export const TOUR_START_EVENT = "kudi:start-tour";

type Step = { target?: string; title: string; text: string };

// Short sentences, everyday words. One idea per step.
const STEPS: Step[] = [
  {
    title: "Welcome to Kudi",
    text: "Kudi helps you see where your money goes. This quick tour takes about one minute. Tap Next to start.",
  },
  {
    target: "hero",
    title: "Your month in one box",
    text: "This shows how much you spent this month, how much came in, and how much is left.",
  },
  {
    target: "add",
    title: "Add money you spent",
    text: "Paid with cash? Tap this red + button. Type the amount, tap what it was for, then tap Save.",
  },
  {
    target: "book",
    title: "Personal or Business",
    text: "Keep your own money and your work money apart. Tap Personal or Business to switch.",
  },
  {
    target: "month",
    title: "Look at other months",
    text: "Tap the arrows to go back to last month, or the month before.",
  },
  {
    target: "nav-/transactions",
    title: "Records",
    text: "Every cedi in and out, day by day. Tap any record to change it or delete it.",
  },
  {
    target: "nav-/categories",
    title: "Budgets",
    text: "Set a limit for things like food or transport. Kudi tells you when you spend more than that.",
  },
  {
    target: "nav-/settings",
    title: "Auto MoMo",
    text: "Set this up once, and your MoMo payments will add themselves. No typing needed.",
  },
  {
    title: "You're ready",
    text: "That's all. If you ever get stuck, open Help. It explains everything step by step, and you can watch this tour again.",
  },
];

/** Finds the copy of a target that is actually on screen (phones and computers show different ones). */
function findTarget(name: string): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  return all.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
  }) ?? null;
}

export default function Tour() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);

  // Starts by itself the first time, after the opening animation has finished.
  useEffect(() => {
    let done = false;
    try {
      done = localStorage.getItem(TOUR_DONE) === "1";
    } catch {
      /* ignore */
    }
    const params = new URLSearchParams(window.location.search);
    const asked = params.get("tour") === "1";
    if (done && !asked) return;

    const start = () => {
      setI(0);
      setOpen(true);
    };
    const wait = setInterval(() => {
      if (document.documentElement.dataset.intro === "done" || !document.querySelector(".intro-overlay")) {
        clearInterval(wait);
        setTimeout(start, 500);
      }
    }, 300);
    return () => clearInterval(wait);
  }, []);

  // "Take the tour again" from anywhere on the page.
  useEffect(() => {
    const again = () => {
      setI(0);
      setOpen(true);
    };
    window.addEventListener(TOUR_START_EVENT, again);
    return () => window.removeEventListener(TOUR_START_EVENT, again);
  }, []);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(TOUR_DONE, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
    const url = new URL(window.location.href);
    if (url.searchParams.has("tour")) {
      url.searchParams.delete("tour");
      window.history.replaceState(null, "", url);
    }
  }, []);

  const step = STEPS[i];

  // Measure where the highlighted part is, and keep it measured as the page moves.
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
      const el = step.target ? findTarget(step.target) : null;
      setRect(el ? el.getBoundingClientRect() : null);
    };
    const el = step.target ? findTarget(step.target) : null;
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top < 80 || r.bottom > window.innerHeight - 100) el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    measure();
    const t = setTimeout(measure, 380);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, i, step.target]);

  // Freeze the page behind the tour (the tour itself can still scroll it into place).
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const before = { overflow: html.style.overflow, touch: html.style.touchAction, overscroll: html.style.overscrollBehavior };
    html.style.overflow = "hidden";
    html.style.touchAction = "none";
    html.style.overscrollBehavior = "none";
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("touchmove", block, { passive: false });
    document.addEventListener("wheel", block, { passive: false });
    return () => {
      html.style.overflow = before.overflow;
      html.style.touchAction = before.touch;
      html.style.overscrollBehavior = before.overscroll;
      document.removeEventListener("touchmove", block);
      document.removeEventListener("wheel", block);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, STEPS.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, finish]);

  if (!open) return null;

  const pad = 8;
  const hole = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  // Card goes below the highlighted part if there's room, otherwise above it.
  const cardW = Math.min(360, vw - 32);
  let cardStyle: React.CSSProperties;
  if (hole) {
    const below = hole.top + hole.height + 14;
    const fitsBelow = below + 230 < vh;
    const left = Math.max(16, Math.min(hole.left + hole.width / 2 - cardW / 2, vw - cardW - 16));
    cardStyle = fitsBelow
      ? { top: below, left, width: cardW }
      : { bottom: Math.max(16, vh - hole.top + 14), left, width: cardW };
  } else {
    // Centred without transforms, so the pop-in animation can't push it off screen.
    cardStyle = { top: Math.max(16, vh / 2 - 170), left: Math.max(16, (vw - cardW) / 2), width: cardW };
  }

  const last = i === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[65] touch-none overscroll-none" role="dialog" aria-modal="true" aria-label="How to use Kudi">
      {/* Dim everything except the highlighted part. */}
      {hole ? (
        <div
          className="tour-hole pointer-events-none fixed rounded-2xl"
          style={{ ...hole, boxShadow: "0 0 0 9999px rgba(40, 24, 26, 0.62)" }}
        />
      ) : (
        <div className="fade-in fixed inset-0 bg-[rgba(40,24,26,0.62)]" />
      )}
      {hole && <div className="tour-ring pointer-events-none fixed rounded-2xl border-2 border-white" style={hole} />}

      <div key={i} className="pop fixed rounded-2xl bg-white p-5 shadow-2xl" style={cardStyle}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[13px] font-medium text-muted">
            Step {i + 1} of {STEPS.length}
          </p>
          <button onClick={finish} className="press -m-1.5 rounded-full p-1.5 text-muted hover:bg-wash" aria-label="Close the tour">
            <X size={18} />
          </button>
        </div>
        <h2 className="mt-1 text-xl font-bold">{step.title}</h2>
        <p className="mt-1.5 text-[16px] leading-relaxed text-ink/80">{step.text}</p>

        <div className="mt-4 flex h-1 gap-1">
          {STEPS.map((_, n) => (
            <span key={n} className={`h-1 flex-1 rounded-full transition-colors ${n <= i ? "bg-red" : "bg-line"}`} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          {i > 0 ? (
            <button onClick={() => setI(i - 1)} className="btn-soft">
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <button onClick={finish} className="rounded-lg px-2 py-2 text-[15px] font-medium text-muted hover:text-ink">
              Skip tour
            </button>
          )}
          {last ? (
            <div className="flex gap-2">
              <Link href="/guide" onClick={finish} className="btn-soft">
                Open Help
              </Link>
              <button onClick={finish} className="btn">
                Done
              </button>
            </div>
          ) : (
            <button onClick={() => setI(i + 1)} className="btn">
              {i === 0 ? "Start" : "Next"} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
