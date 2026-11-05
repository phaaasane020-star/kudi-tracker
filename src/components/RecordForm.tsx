"use client";

import { Banknote, CalendarDays, CreditCard, Landmark, MoreHorizontal, Smartphone } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { addTransaction, updateTransaction, type FormState } from "@/app/actions";
import { categoryIcon } from "@/lib/category-icons";
import { addToOutbox } from "@/lib/outbox";
import { PAYMENT_METHODS, today } from "@/lib/format";
import type { Category, Transaction, TxType } from "@/lib/types";

const initial: FormState = { ok: false, message: "", stamp: 0 };

export const METHOD_ICONS: Record<string, typeof Banknote> = {
  cash: Banknote,
  momo: Smartphone,
  bank: Landmark,
  card: CreditCard,
  other: MoreHorizontal,
};
const SHORT: Record<string, string> = { cash: "Cash", momo: "MoMo", bank: "Bank", card: "Card", other: "Other" };
const QUICK = [5, 10, 20, 50, 100];

function yesterday() {
  return new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
}

/** Used for both adding a new record and editing an existing one. */
export default function RecordForm({
  bookId,
  categories,
  existing,
  onDone,
}: {
  bookId: string;
  categories: Category[];
  existing?: Transaction;
  onDone?: (message?: string) => void;
}) {
  const editing = !!existing;
  const [type, setType] = useState<TxType>(existing?.type ?? "expense");
  const options = categories.filter((c) => c.type === type && (!c.archived || c.id === existing?.category_id));
  const [categoryId, setCategoryId] = useState<string>(existing?.category_id ?? "");
  const [method, setMethod] = useState<string>(existing?.payment_method ?? "cash");
  const [amount, setAmount] = useState<string>(existing ? existing.amount.toFixed(2) : "");
  const [date, setDate] = useState<string>(existing?.occurred_on ?? today());
  const [state, action, pending] = useActionState(editing ? updateTransaction : addTransaction, initial);
  const amountRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) onDone?.();
  }, [state, onDone]);

  // Jump straight to the amount on computers; on phones let the person choose,
  // so the keyboard doesn't cover the form the moment it opens.
  useEffect(() => {
    if (!editing && window.matchMedia("(pointer: fine)").matches) amountRef.current?.focus();
  }, [editing]);

  const pickType = (t: TxType) => {
    setType(t);
    setCategoryId("");
  };

  const t = today();
  const y = yesterday();
  const otherDate = date !== t && date !== y;
  const accent = type === "expense" ? "text-red" : "text-green";

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (navigator.onLine) return;
        e.preventDefault();
        if (addToOutbox(new FormData(e.currentTarget), editing ? "update" : "create")) {
          onDone?.("Saved on this phone. It uploads when you're back online.");
        }
      }}
      className="flex min-h-full flex-col"
    >
      {existing && <input type="hidden" name="id" value={existing.id} />}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="book_id" value={bookId} />
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="payment_method" value={method} />
      <input type="hidden" name="occurred_on" value={date} />

      <div className="flex-1 space-y-6 pb-4">
        {!editing && (
          <div className="grid grid-cols-2 rounded-xl bg-wash p-1 text-[15px] font-semibold">
            {(["expense", "income"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => pickType(v)}
                className={`press rounded-[10px] py-2.5 ${
                  type === v ? (v === "expense" ? "bg-red text-white shadow-sm" : "bg-green text-white shadow-sm") : "text-muted"
                }`}
              >
                {v === "expense" ? "Money out" : "Money in"}
              </button>
            ))}
          </div>
        )}

        <div>
          <label htmlFor="amount" className="mb-1 block text-sm text-muted">
            Amount
          </label>
          <div className="flex items-baseline gap-2 border-b-2 border-line pb-1.5 focus-within:border-brown">
            <span className={`text-xl font-semibold ${accent} opacity-70`}>GH₵</span>
            <input
              id="amount"
              ref={amountRef}
              name="amount"
              inputMode="decimal"
              enterKeyHint="done"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder="0.00"
              autoComplete="off"
              className={`display tabular w-full min-w-0 bg-transparent text-[40px] font-bold leading-tight outline-none placeholder:text-line ${accent}`}
            />
          </div>
          <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(q.toFixed(2))}
                className={`chip press tabular ${Number(amount) === q ? "chip-on" : ""}`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <fieldset>
          <legend className="mb-2.5 text-sm text-muted">Category</legend>
          <div className="grid grid-cols-4 gap-x-1 gap-y-3">
            {options.map((c) => {
              const Icon = categoryIcon(c.name, c.type);
              const on = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(on ? "" : c.id)}
                  aria-pressed={on}
                  className="press flex flex-col items-center gap-1.5 rounded-xl px-0.5 py-1"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition ${on ? "ring-2 ring-brown ring-offset-2" : ""}`}
                    style={{ background: on ? c.color : c.color + "1a", color: on ? "#fff" : c.color }}
                  >
                    <Icon size={20} strokeWidth={1.9} />
                  </span>
                  <span className={`line-clamp-2 text-center text-[12px] leading-tight ${on ? "font-semibold text-ink" : "text-muted"}`}>{c.name}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2.5 text-sm text-muted">Paid with</legend>
          <div className="grid grid-cols-5 gap-1.5">
            {PAYMENT_METHODS.map((p) => {
              const Icon = METHOD_ICONS[p.value];
              const on = method === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setMethod(p.value)}
                  aria-pressed={on}
                  aria-label={p.label}
                  className={`press flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[12px] font-medium ${
                    on ? "border-brown bg-brown text-cream" : "border-line text-muted"
                  }`}
                >
                  <Icon size={18} />
                  {SHORT[p.value]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2.5 text-sm text-muted">When</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setDate(t)} className={`chip press ${date === t ? "chip-on" : ""}`}>
              Today
            </button>
            <button type="button" onClick={() => setDate(y)} className={`chip press ${date === y ? "chip-on" : ""}`}>
              Yesterday
            </button>
            <label className={`chip press relative cursor-pointer ${otherDate ? "chip-on" : ""}`}>
              <CalendarDays size={15} />
              {otherDate ? new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : "Other day"}
              <input
                ref={dateRef}
                type="date"
                value={date}
                max={t}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Pick a date"
              />
            </label>
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Note (optional)</span>
          <input
            name="description"
            maxLength={200}
            enterKeyHint="done"
            defaultValue={existing?.description ?? ""}
            className="field"
            placeholder={type === "expense" ? "What was it for?" : "Where did it come from?"}
          />
        </label>
      </div>

      {/* Stays on screen while you scroll, and above the keyboard on iPhone. */}
      <div className="sticky bottom-0 -mx-5 border-t border-line/60 bg-white/95 px-5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        {state.message && !state.ok && (
          <p className="fade-in mb-2.5 rounded-xl bg-red/10 px-3.5 py-2 text-sm text-red-dark" role="alert">
            {state.message}
          </p>
        )}
        <button className={`btn w-full py-3.5 ${type === "income" && !editing ? "bg-green hover:bg-green/90" : ""}`} disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : type === "expense" ? "Save money out" : "Save money in"}
        </button>
      </div>
    </form>
  );
}
