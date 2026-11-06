import { MessageSquareText, UtensilsCrossed } from "lucide-react";

/**
 * Shows, before anyone signs in, what MoMo Sync actually does:
 * an SMS arrives → Kudi records it → the budget moves.
 * "panel" sits in the brown sign-in panel on tablets and computers;
 * "strip" is the compact version for phones.
 */
export default function HowItWorks({ variant }: { variant: "panel" | "strip" }) {
  if (variant === "strip") {
    const steps = [
      { n: 1, title: "SMS arrives", note: "from MoMo or Telecel Cash" },
      { n: 2, title: "Kudi records it", note: "amount, who, category" },
      { n: 3, title: "Budget updates", note: "you see it straight away" },
    ];
    return (
      <div className="rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgba(63,41,43,0.04),0_12px_32px_-16px_rgba(63,41,43,0.18)]">
      <p className="mb-2 px-0.5 text-[13px] font-semibold">How it works</p>
      <ol className="grid grid-cols-3 gap-2" aria-label="How Kudi works">
        {steps.map((s) => (
          <li key={s.n} className="rounded-xl bg-wash px-2.5 py-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red text-[11px] font-bold text-white">{s.n}</span>
            <span className="mt-1 block text-[13px] font-semibold leading-tight">{s.title}</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-muted">{s.note}</span>
          </li>
        ))}
      </ol>
      </div>
    );
  }

  return (
    <ol className="space-y-3" aria-label="How Kudi works">
      <Step n={1} label="An SMS arrives">
        <div className="rounded-2xl rounded-bl-md bg-white/95 px-3.5 py-2.5 text-[12.5px] leading-snug text-brown shadow-lg">
          <span className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold text-muted">
            <MessageSquareText size={12} /> MobileMoney
          </span>
          Payment made for GHS 25.00 to KOFI&apos;S CHOP BAR. Transaction ID: 51234…
        </div>
      </Step>
      <Step n={2} label="Kudi records it for you">
        <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-3.5 py-2.5 text-brown shadow-lg">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C2703D]/15 text-[#C2703D]">
            <UtensilsCrossed size={15} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold">Kofi&apos;s Chop Bar</span>
            <span className="block text-[11px] text-muted">Food</span>
          </span>
          <span className="text-right">
            <span className="tabular block text-[13px] font-semibold">−GH₵25.00</span>
            <span className="block text-[11px] text-orange">MoMo, auto</span>
          </span>
        </div>
      </Step>
      <Step n={3} label="Your budget updates">
        <div className="rounded-2xl bg-white/95 px-3.5 py-3 text-brown shadow-lg">
          <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
            <span className="font-semibold">Food</span>
            <span className="tabular text-muted">GH₵325 of GH₵400</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-wash">
            <div className="grow-x h-full w-[81%] rounded-full bg-[#C2703D]" style={{ ["--i" as string]: 6 }} />
          </div>
        </div>
      </Step>
      <li className="pl-9 text-sm text-cream/60">Spent cash? Add it in two taps.</li>
    </ol>
  );
}

function Step({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <li className="rise grid grid-cols-[1.5rem_1fr] gap-x-3" style={{ ["--i" as string]: n + 1 }}>
      <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-red text-xs font-bold text-white">{n}</span>
      <div>
        <p className="mb-1.5 text-sm font-medium text-cream/85">{label}</p>
        {children}
      </div>
    </li>
  );
}
