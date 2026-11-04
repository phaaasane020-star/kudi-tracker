"use client";

import { Trash2 } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { deleteTransaction } from "@/app/actions";
import RecordForm from "@/components/RecordForm";
import { categoryIcon } from "@/lib/category-icons";
import Sheet from "@/components/Sheet";
import { cedi, dateLabel, paymentLabel } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";

export default function TransactionList({
  transactions,
  categories,
  empty,
  dayTotals = true,
}: {
  transactions: Transaction[];
  categories: Category[];
  empty: React.ReactNode;
  dayTotals?: boolean;
}) {
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, startDelete] = useTransition();
  const close = useCallback(() => setEditing(null), []);

  if (transactions.length === 0) return <div className="py-10 text-center text-[15px] text-muted">{empty}</div>;

  const byId = new Map(categories.map((c) => [c.id, c]));
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) groups.set(t.occurred_on, [...(groups.get(t.occurred_on) ?? []), t]);

  return (
    <>
      <div className="space-y-5">
        {[...groups.entries()].map(([date, items]) => {
          const out = items.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
          return (
            <section key={date}>
              <div className="mb-0.5 flex items-baseline justify-between text-[13px]">
                <h3 className="font-semibold text-muted">{dateLabel(date)}</h3>
                {dayTotals && out > 0 && <span className="tabular text-muted">{cedi(out)} out</span>}
              </div>
              <ul>
                {items.map((t) => {
                  const cat = t.category_id ? byId.get(t.category_id) : undefined;
                  const Icon = categoryIcon(cat?.name, t.type);
                  const title = t.counterparty || t.description || cat?.name || "Record";
                  const method = t.source === "sms" ? "MoMo, auto" : paymentLabel(t.payment_method);
                  return (
                    <li key={t.id} className="border-b border-line/70 last:border-0">
                      <button
                        onClick={() => setEditing(t)}
                        className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-wash"
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                          style={{ background: (cat?.color ?? "#85706f") + "1a", color: cat?.color ?? "#85706f" }}
                        >
                          <Icon size={18} strokeWidth={1.9} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium leading-snug">{title}</span>
                          {t.needs_review ? (
                            <span className="block text-[13px] font-medium text-orange">Choose a category</span>
                          ) : (
                            <span className="block truncate text-[13px] text-muted">{cat?.name ?? "No category"}</span>
                          )}
                        </span>
                        <span className="shrink-0 text-right">
                          <span className={`tabular block text-[15px] font-semibold leading-snug ${t.type === "income" ? "text-green" : "text-ink"}`}>
                            {t.type === "income" ? "+" : "−"}
                            {cedi(t.amount)}
                          </span>
                          <span className={`block text-[12px] ${t.source === "sms" ? "text-orange" : "text-muted"}`}>{method}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <Sheet open={!!editing} onClose={close} title={editing?.type === "income" ? "Money in" : "Money out"}>
        {editing && (
          <>
            {editing.source === "sms" && (
              <p className="mb-4 rounded-xl border-l-[3px] border-orange bg-cream px-3.5 py-3 text-sm">
                Recorded automatically from a {paymentLabel(editing.payment_method)} SMS
                {editing.counterparty ? ` for ${editing.counterparty}` : ""}.
              </p>
            )}
            <RecordForm key={editing.id} bookId={editing.book_id} categories={categories} existing={editing} onDone={close} />
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                if (!editing) return;
                const fd = new FormData();
                fd.set("id", editing.id);
                startDelete(async () => {
                  await deleteTransaction(fd);
                  close();
                });
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-red-dark hover:bg-red/5"
            >
              <Trash2 size={16} /> {deleting ? "Deleting…" : "Delete this record"}
            </button>
          </>
        )}
      </Sheet>
    </>
  );
}
