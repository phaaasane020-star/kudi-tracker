"use client";

import { ArrowRight, Bus, Smartphone, UtensilsCrossed, Wifi } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { INTRO_FLAG } from "@/lib/intro";

/**
 * The opening animation. Plays every time the app is opened: on a fresh launch,
 * a new tab, or coming back after the app has been in the background a while.
 * A tiny script in the page head hides it straight away for in-app reloads,
 * so it never flashes.
 */
const AWAY_MS = 10 * 60_000; // back after 10 minutes away counts as opening the app again
const SLIDE_MS = 5200;
const SLIDES_SEEN = "kudi-slides-seen-v1"; // the three slides show once per device; the splash shows every launch

export default function Intro() {
  const [stage, setStage] = useState<"splash" | "slides" | "hidden">("splash");
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_FLAG, "1");
      localStorage.setItem(SLIDES_SEEN, "1");
    } catch {
      /* ignore */
    }
    document.documentElement.dataset.intro = "done";
    setStage("hidden");
  }, []);

  const play = useCallback(() => {
    document.documentElement.dataset.intro = "playing";
    setI(0);
    setDir(1);
    setStage("splash");
  }, []);

  // Plays every time the app is opened (each fresh launch or full page load).
  useEffect(() => {
    play();
  }, [play]);

  // Coming back to the app after a while plays it again.
  useEffect(() => {
    let hiddenAt = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > AWAY_MS) play();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [play]);

  // Splash, then the slides move on by themselves like a short video.
  useEffect(() => {
    if (stage === "splash") {
      let seen = false;
      try {
        seen = localStorage.getItem(SLIDES_SEEN) === "1";
      } catch {
        /* ignore */
      }
      const t = setTimeout(() => (seen ? finish() : setStage("slides")), seen ? 1800 : 2600);
      return () => clearTimeout(t);
    }
    if (stage === "slides" && !paused) {
      const t = setTimeout(() => (i >= 2 ? finish() : (setDir(1), setI(i + 1))), SLIDE_MS);
      return () => clearTimeout(t);
    }
  }, [stage, i, paused, finish]);

  useEffect(() => {
    if (stage === "hidden") return;
    const html = document.documentElement;
    const o = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = o;
    };
  }, [stage]);

  const go = (n: number) => {
    if (n < 0) return;
    if (n > 2) return finish();
    setDir(n > i ? 1 : -1);
    setI(n);
  };

  if (stage === "hidden") return null;

  if (stage === "splash") {
    return (
      <div className="intro-overlay fixed inset-0 z-[70] flex flex-col items-center justify-center bg-red text-white" aria-label="Kudi Tracker">
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
      className="intro-overlay fixed inset-0 z-[70] flex flex-col bg-white"
      role="dialog"
      aria-label="Welcome to Kudi Tracker"
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
      onPointerCancel={() => setPaused(false)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? i + 1 : i - 1);
        touch.current = null;
      }}
    >
      {/* Story-style progress: each bar fills while its slide plays. */}
      <div className="safe-top mx-auto flex w-full max-w-5xl gap-1.5 px-5 pt-3">
        {slides.map((_, n) => (
          <span key={n} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
            <span
              key={`${n}-${i}`}
              className={`block h-full rounded-full bg-red ${n < i ? "w-full" : n === i ? "intro-progress" : "w-0"}`}
              style={n === i ? { animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" } : undefined}
            />
          </span>
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 pt-3 landscape:pt-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red text-lg font-bold text-white">₵</span>
        <button onClick={finish} className="press rounded-full px-3 py-1.5 text-[15px] font-medium text-muted hover:bg-wash">
          Skip
        </button>
      </div>

      {/* Phones: picture above text. iPad portrait: the same, larger.
          Any screen on its side (iPad landscape, phone landscape): side by side. */}
      <div className="flex min-h-0 flex-1 items-center overflow-hidden px-6 landscape:px-10">
        <div
          key={i}
          className={`mx-auto grid w-full max-w-sm items-center gap-7 md:max-w-lg md:gap-10 landscape:max-w-5xl landscape:grid-cols-2 landscape:gap-12 ${
            dir === 1 ? "slide-in-right" : "slide-in-left"
          }`}
        >
          <div className="flex h-[clamp(10rem,34dvh,16rem)] items-center justify-center overflow-hidden rounded-[28px] bg-cream md:h-[min(24rem,40dvh)] landscape:h-[min(26rem,64dvh)]">
            <div className="origin-center md:scale-125 landscape:scale-100 landscape:md:scale-110 lg:scale-125">{s.art}</div>
          </div>
          <div>
            <h2 className="display text-[clamp(1.75rem,7vw,2.25rem)] font-bold leading-[1.05] md:text-5xl landscape:text-[clamp(1.6rem,3.2vw+0.6rem,3.25rem)]">
              {s.title}
            </h2>
            <p className="mt-3 text-[17px] leading-relaxed text-muted md:text-lg landscape:text-[clamp(0.95rem,0.6vw+0.7rem,1.15rem)]">{s.body}</p>
            <div className="mt-8 hidden landscape:flex">
              <button onClick={() => go(i + 1)} className="btn px-6">
                {i === 2 ? "Open Kudi" : "Next"} <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="safe-bottom mx-auto flex w-full max-w-sm items-center justify-end px-6 pb-8 pt-4 md:max-w-lg landscape:hidden">
        <button onClick={() => go(i + 1)} className="btn px-6">
          {i === 2 ? "Open Kudi" : "Next"} <ArrowRight size={18} />
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
