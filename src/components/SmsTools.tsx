"use client";

import { ArrowRight, Check, Copy } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { importSms, type FormState } from "@/app/actions";

export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="mb-1.5 text-sm text-muted">{label}</p>
      <div className="flex gap-2">
        <input readOnly value={value} onFocus={(e) => e.target.select()} className="field min-w-0 flex-1 font-mono text-[13px]" />
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            } catch {
              /* clipboard blocked: the field is selectable */
            }
          }}
          className="btn-dark shrink-0 px-3.5"
        >
          {copied ? <Check size={17} /> : <Copy size={17} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

const initial: FormState = { ok: false, message: "", stamp: 0 };

export function PasteSms({ bookId }: { bookId: string }) {
  const [state, action, pending] = useActionState(importSms, initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="book_id" value={bookId} />
      <textarea
        name="text"
        rows={4}
        required
        placeholder="Paste a MoMo message here"
        className="field resize-none"
      />
      <button className="btn-dark w-full" disabled={pending}>
        {pending ? "Reading…" : "Record this message"}
      </button>
      {state.message && (
        <div className={`fade-in rounded-xl px-3.5 py-3 text-sm ${state.ok ? "bg-green/10 text-green" : "bg-cream text-ink"}`} role="status">
          <p>{state.message}</p>
          {state.href && (
            <Link href={state.href} className="mt-2 inline-flex items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline">
              {state.hrefLabel ?? "See it"} <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}
    </form>
  );
}
