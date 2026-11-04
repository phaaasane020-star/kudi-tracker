"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * A delete button that needs two taps: the first arms it ("Tap again to delete"),
 * the second submits its form. It disarms itself after a few seconds.
 * Put it inside a <form action={...}>.
 */
export default function ConfirmButton({
  label,
  confirmLabel = "Tap again to delete",
  size = "md",
  disabled = false,
}: {
  label: string;
  confirmLabel?: string;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  const base =
    size === "sm"
      ? "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium"
      : "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold sm:w-auto";

  return (
    <button
      type={armed ? "submit" : "button"}
      disabled={disabled || pending}
      onClick={(e) => {
        if (!armed) {
          e.preventDefault();
          setArmed(true);
        }
      }}
      className={`press ${base} transition-colors disabled:opacity-50 ${
        armed ? "bg-red text-white" : size === "sm" ? "text-muted hover:bg-red/10 hover:text-red-dark" : "border border-red/30 bg-white text-red-dark hover:bg-red/5"
      }`}
      aria-live="polite"
    >
      <Trash2 size={size === "sm" ? 14 : 16} />
      {pending ? "Deleting…" : armed ? confirmLabel : label}
    </button>
  );
}
