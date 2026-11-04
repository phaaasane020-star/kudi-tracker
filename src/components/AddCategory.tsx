"use client";

import { Plus } from "lucide-react";
import { useActionState, useCallback, useEffect, useState } from "react";
import { addCategory, type FormState } from "@/app/actions";
import Sheet from "@/components/Sheet";

const initial: FormState = { ok: false, message: "", stamp: 0 };
const COLOURS = ["#EF4444", "#F97316", "#166534", "#3F292B", "#C29A2E", "#3D6F8C", "#7A5C99", "#A04F6B"];

export default function AddCategory({ bookId }: { bookId: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-soft">
        <Plus size={16} /> New category
      </button>
      <Sheet open={open} onClose={close} title="New category">
        <Form bookId={bookId} onDone={close} />
      </Sheet>
    </>
  );
}

function Form({ bookId, onDone }: { bookId: string; onDone: () => void }) {
  const [state, action, pending] = useActionState(addCategory, initial);
  const [type, setType] = useState("expense");
  const [color, setColor] = useState(COLOURS[0]);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="space-y-4 pb-[calc(20px+env(safe-area-inset-bottom))]">
      <input type="hidden" name="book_id" value={bookId} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="color" value={color} />

      <div className="grid grid-cols-2 rounded-2xl bg-wash p-1 text-[15px] font-semibold">
        {[
          ["expense", "Money out"],
          ["income", "Money in"],
        ].map(([v, l]) => (
          <button key={v} type="button" onClick={() => setType(v)} className={`rounded-xl py-2.5 ${type === v ? "bg-brown text-cream" : "text-muted"}`}>
            {l}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Name</span>
        <input name="name" required maxLength={60} placeholder="Category name" className="field" autoFocus />
      </label>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">Colour</legend>
        <div className="flex flex-wrap gap-2.5">
          {COLOURS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              className={`h-9 w-9 rounded-full transition ${color === c ? "ring-2 ring-brown ring-offset-2" : ""}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </fieldset>

      {type === "expense" && (
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Monthly budget (optional)</span>
          <input name="monthly_budget" inputMode="decimal" placeholder="No limit" className="field" />
        </label>
      )}

      {state.message && !state.ok && <p className="rounded-xl bg-red/10 px-3.5 py-2.5 text-sm text-red-dark">{state.message}</p>}
      <button className="btn w-full" disabled={pending}>
        {pending ? "Adding…" : "Add category"}
      </button>
    </form>
  );
}
