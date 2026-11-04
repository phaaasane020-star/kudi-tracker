"use client";

import { Check, X } from "lucide-react";
import { passwordChecks, passwordScore } from "@/lib/password";

const LEVELS = [
  { label: "", color: "bg-line" },
  { label: "Weak", color: "bg-red" },
  { label: "Getting there", color: "bg-orange" },
  { label: "Good", color: "bg-[#C29A2E]" },
  { label: "Strong", color: "bg-green" },
];

/** Live strength bar and the rules, ticking off as you type. */
export default function PasswordMeter({ password, email = "" }: { password: string; email?: string }) {
  const score = passwordScore(password, email);
  const checks = passwordChecks(password, email);
  const strong = checks.every((c) => c.ok);
  const level = strong ? LEVELS[4] : LEVELS[Math.min(score, 3)];

  return (
    <div className="mt-2.5" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-4 gap-1">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={`h-1.5 rounded-full transition-colors duration-300 ${n <= (strong ? 4 : score) ? level.color : "bg-line"}`} />
          ))}
        </div>
        <span className="w-24 text-right text-[12px] font-medium text-muted">{password ? level.label : ""}</span>
      </div>
      <ul className="mt-2 grid gap-1 text-[13px] sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.label} className={`flex items-center gap-1.5 ${c.ok ? "text-green" : "text-muted"}`}>
            {c.ok ? <Check size={14} strokeWidth={3} /> : <X size={14} className="opacity-50" />}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
