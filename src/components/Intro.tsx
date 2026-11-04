"use client";

import { ArrowRight, Bus, Smartphone, UtensilsCrossed, Wifi } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const KEY = "kudi-intro-seen-v1";

/** First-visit welcome: a short splash, then three swipeable slides. Shown once per device. */
export default function Intro() {
  const [stage, setStage] = useState<"hidden" | "splash" | "slides">("hidden");
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(KEY) === "1";
    } catch {
      /* private mode: show it */
    }
    if (seen) return;
    setStage("splash");
    const t = setTimeout(() => setStage("slides"), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (stage === "hidden") return;
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = o;
    };
  }, [stage]);

  const finish = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setStage("hidden");
  };
  const go = (n: number) => {
    if (n < 0) return;
    if (n > 2) return finish();
    setDir(n > i ? 1 : -1);
    setI(n);
  };

  if (stage === "hidden") return null;

  if (stage === "splash") {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-red text-white" aria-label="Kudi Tracker">
        <div className="relative">
          <span className="splash-ring absolute inset-0 rounded-[28px] border-2 border-white/70" />
          <span className="splash-mark flex h-24 w-24 items-center justify-center rounded-[28px] bg-white text-5xl font-bold text-red shadow-xl">₵</span>
        </div>
        <p className="rise display mt-6 text-3xl font-bold" style={{ ["--i" as string]: 4 }}>
          Kudi Tracker
        </p>
        <p className="rise mt-1 text-white/80" style={{ ["--i" as string]: 6 }}>
          Know where every cedi goes
        </p>
      </div>
    );
  }

  const slides = [
    {
      title: "Every cedi, accounted for",
      body: "See what you spent today, this week and this month, for your personal money and your business.",
      art: <ArtTotal />,
    },
    {
      title: "MoMo records itself",
      body: "When a MoMo payment SMS lands on your phone, Kudi records it for you. Cash takes two taps.",
      art: <ArtSms />,
    },
    {
      title: "Budgets that warn you early",
      body: "Give each category a monthly limit and see the moment you go over, before month end surprises you.",
      art: <ArtBudgets />,
    },
  ];
  const s = slides[i];

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-white"
      role="dialog"
      aria-label="Welcome to Kudi Tracker"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? i + 1 : i - 1);
        touch.current = null;
      }}
    >
      <div className="safe-top flex items-center justify-between px-5 pt-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red text-lg font-bold text-white">₵</span>
        <button onClick={finish} className="rounded-full px-3 py-1.5 text-[15px] font-medium text-muted hover:bg-wash">
          Skip
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-center overflow-hidden px-6">
        <div key={i} className={`mx-auto w-full max-w-sm ${dir === 1 ? "slide-in-right" : "slide-in-left"}`}>
          <div className="mb-10 flex h-64 items-center justify-center rounded-[28px] bg-cream">{s.art}</div>
          <h2 className="display text-[34px] font-bold leading-[1.05]">{s.title}</h2>
          <p className="mt-3 text-[17px] leading-relaxed text-muted">{s.body}</p>
        </div>
      </div>

      <div className="safe-bottom mx-auto flex w-full max-w-sm items-center justify-between px-6 pb-8 pt-4">
        <div className="flex gap-2" role="tablist" aria-label="Slides">
          {slides.map((_, n) => (
            <button
              key={n}
              onClick={() => go(n)}
              aria-label={`Slide ${n + 1}`}
              aria-selected={n === i}
              role="tab"
              className={`h-2 rounded-full transition-all duration-300 ${n === i ? "w-7 bg-red" : "w-2 bg-line"}`}
            />
          ))}
        </div>
        <button onClick={() => go(i + 1)} className="btn px-6">
          {i === 2 ? "Get started" : "Next"} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

function ArtTotal() {
  return (
    <div className="float-slow w-56 rounded-[20px] bg-brown p-4 text-cream shadow-xl">
      <p className="text-xs text-cream/70">Spent in November</p>
      <p className="display tabular mt-1 text-3xl font-bold">
        <span className="mr-0.5 align-[0.4em] text-xs opacity-70">GH₵</span>1,240<span className="opacity-55">.50</span>
      </p>
      <div className="mt-3 flex h-2 gap-[2px] overflow-hidden rounded-full">
        {["#C2703D", "#3D6F8C", "#7A5C99", "#C29A2E", "#F97316"].map((c, n) => (
          <span key={c} className="grow-x block h-full" style={{ background: c, flexGrow: 5 - n, ["--i" as string]: n }} />
        ))}
      </div>
    </div>
  );
}

function ArtSms() {
  return (
    <div className="relative h-40 w-60">
      <div className="sms-to-record absolute inset-x-0 top-4 rounded-2xl rounded-bl-sm bg-white p-3 text-[12px] leading-snug shadow-lg">
        <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-muted">
          <Smartphone size={12} /> MobileMoney
        </p>
        Payment made for GHS 25.00 to KOFI&apos;S CHOP BAR. Transaction ID: 51234…
      </div>
      <div className="record-appear absolute inset-x-0 top-8 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-lg">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C2703D]/15 text-[#C2703D]">
          <UtensilsCrossed size={16} />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium">Kofi&apos;s Chop Bar</span>
          <span className="block text-xs text-muted">Food</span>
        </span>
        <span className="text-right">
          <span className="tabular block text-sm font-semibold">−GH₵25.00</span>
          <span className="block text-[11px] text-orange">MoMo, auto</span>
        </span>
      </div>
    </div>
  );
}

function ArtBudgets() {
  const rows = [
    { name: "Food", icon: UtensilsCrossed, color: "#C2703D", pct: 62 },
    { name: "Transport", icon: Bus, color: "#3D6F8C", pct: 38 },
    { name: "Airtime & Data", icon: Wifi, color: "#ef4444", pct: 100 },
  ];
  return (
    <div className="w-60 space-y-3.5 rounded-[20px] bg-white p-4 shadow-xl">
      {rows.map((r, n) => (
        <div key={r.name}>
          <div className="mb-1 flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-1.5 font-medium">
              <r.icon size={13} style={{ color: r.color }} /> {r.name}
            </span>
            {r.pct === 100 && <span className="pop text-[11px] font-semibold text-red">Over budget</span>}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-wash">
            <div className="grow-x h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color, ["--i" as string]: n * 2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
