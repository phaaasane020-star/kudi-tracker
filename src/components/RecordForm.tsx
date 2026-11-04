"use client";

import { Banknote, CreditCard, Landmark, MoreHorizontal, Smartphone } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { addTransaction, updateTransaction, type FormState } from "@/app/actions";
import { categoryIcon } from "@/lib/category-icons";
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
  onDone?: () => void;
}) {
  const editing = !!existing;
  const [type, setType] = useState<TxType>(existing?.type ?? "expense");
  const options = categories.filter((c) => c.type === type && (!c.archived || c.id === existing?.category_id));
  const [categoryId, setCategoryId] = useState<string>(existing?.category_id ?? "");
  const [method, setMethod] = useState<string>(existing?.payment_method ?? "cash");
  const [state, action, pending] = useActionState(editing ? updateTransaction : addTransaction, initial);

  useEffect(() => {
    if (state.ok) onDone?.();
  }, [state, onDone]);

  const pickType = (t: TxType) => {
    setType(t);
    setCategoryId("");
  };

  return (
    <form action={action} className="space-y-5">
      {existing && <input type="hidden" name="id" value={existing.id} />}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="book_id" value={bookId} />
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="payment_method" value={method} />

      {!editing && (
        <div className="grid grid-cols-2 rounded-2xl bg-wash p-1 text-[15px] font-semibold">
          <button
            type="button"
            onClick={() => pickType("expense")}
            className={`rounded-xl py-2.5 transition ${type === "expense" ? "bg-red text-white shadow-sm" : "text-muted"}`}
          >
            Money out
          </button>
          <button
            type="button"
            onClick={() => pickType("income")}
            className={`rounded-xl py-2.5 transition ${type === "income" ? "bg-green text-white shadow-sm" : "text-muted"}`}
          >
            Money in
          </button>
        </div>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Amount</span>
        <div className="flex items-baseline gap-2 border-b-2 border-line pb-2 focus-within:border-brown">
          <span className="text-2xl font-semibold text-muted">GH₵</span>
          <input
            name="amount"
            inputMode="decimal"
            required
            autoFocus={!editing}
            defaultValue={existing ? existing.amount.toFixed(2) : ""}
            placeholder="0.00"
            autoComplete="off"
            className={`display tabular w-full bg-transparent text-[44px] font-bold leading-none outline-none placeholder:text-line ${
              type === "expense" ? "text-red" : "text-green"
            }`}
          />
        </div>
      </label>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">Category</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={`chip ${categoryId === c.id ? "chip-on" : ""}`}
            >
              <CatGlyph name={c.name} color={categoryId === c.id ? undefined : c.color} />
              {c.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">Paid with</legend>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {PAYMENT_METHODS.map((p) => {
            const Icon = METHOD_ICONS[p.value];
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setMethod(p.value)}
                className={`chip ${method === p.value ? "chip-on" : ""}`}
              >
                <Icon size={15} />
                {p.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-[1fr_9.5rem] gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Note</span>
          <input
            name="description"
            maxLength={200}
            defaultValue={existing?.description ?? ""}
            className="field"
            placeholder={type === "expense" ? "What was it for?" : "Where did it come from?"}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Date</span>
          <input
            type="date"
            name="occurred_on"
            defaultValue={existing?.occurred_on ?? today()}
            max={today()}
            required
            className="field"
          />
        </label>
      </div>

      {state.message && !state.ok && (
        <p className="rounded-xl bg-red/10 px-3.5 py-2.5 text-sm text-red-dark" role="alert">
          {state.message}
        </p>
      )}

      <button className={type === "income" && !editing ? "btn w-full bg-green hover:bg-green/90" : "btn w-full"} disabled={pending}>
        {pending ? "Saving…" : editing ? "Save changes" : type === "expense" ? "Save money out" : "Save money in"}
      </button>
    </form>
  );
}

function CatGlyph({ name, color }: { name: string; color?: string }) {
  const I = categoryIcon(name);
  return <I size={15} strokeWidth={2} style={color ? { color } : undefined} />;
}
