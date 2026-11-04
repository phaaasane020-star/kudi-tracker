import { Search } from "lucide-react";
import Link from "next/link";
import AppShell, { link } from "@/components/AppShell";
import ExportButtons, { type ExportRow } from "@/components/ExportButtons";
import TransactionList from "@/components/TransactionList";
import { loadCategories, loadContext, loadMonthTransactions, type PageParams } from "@/lib/data";
import { cedi, shortMonth } from "@/lib/format";

type Params = PageParams & { view?: string; category?: string; q?: string };

const VIEWS = [
  { value: "", label: "All" },
  { value: "out", label: "Money out" },
  { value: "in", label: "Money in" },
  { value: "auto", label: "MoMo Sync" },
  { value: "cash", label: "Cash" },
  { value: "review", label: "Needs a category" },
];

export default async function RecordsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const { supabase, book, month } = await loadContext(params);
  const [categories, all] = await Promise.all([
    loadCategories(supabase, book.id),
    loadMonthTransactions(supabase, book.id, month),
  ]);

  const view = VIEWS.some((v) => v.value === params.view) ? params.view ?? "" : "";
  const category = params.category ?? "";
  const q = (params.q ?? "").trim().toLowerCase();

  const txs = all.filter((t) => {
    if (view === "out" && t.type !== "expense") return false;
    if (view === "in" && t.type !== "income") return false;
    if (view === "auto" && t.source !== "sms") return false;
    if (view === "cash" && t.payment_method !== "cash") return false;
    if (view === "review" && !t.needs_review) return false;
    if (category && (category === "none" ? t.category_id : t.category_id !== category)) return false;
    if (q && !`${t.description ?? ""} ${t.counterparty ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const names = new Map(categories.map((c) => [c.id, c.name]));
  const rows: ExportRow[] = txs.map((t) => ({
    date: t.occurred_on,
    type: t.type,
    category: t.category_id ? names.get(t.category_id) ?? "" : "No category",
    note: [t.counterparty, t.description && t.description !== t.counterparty ? t.description : null].filter(Boolean).join(", "),
    method: t.payment_method,
    amount: t.amount,
  }));

  const spent = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const earned = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const keep = (extra: Record<string, string>) =>
    link("/transactions", book.kind, month, Object.fromEntries(Object.entries({ view, category, q: params.q ?? "", ...extra }).filter(([, v]) => v)));

  return (
    <AppShell path="/transactions" book={book} month={month} categories={categories} title="Records">
      <div className="mx-auto max-w-3xl space-y-4">
        <form className="grid grid-cols-[1fr_auto] gap-2 sm:flex">
          <input type="hidden" name="book" value={book.kind} />
          <input type="hidden" name="month" value={month} />
          {view && <input type="hidden" name="view" value={view} />}
          <label className="relative col-span-2 sm:flex-1">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={params.q ?? ""} placeholder="Search names and notes" className="field pl-10" />
          </label>
          <select name="category" defaultValue={category} className="field sm:w-48" aria-label="Category">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="none">No category</option>
          </select>
          <button className="btn-dark px-4" aria-label="Search">
            Go
          </button>
        </form>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {VIEWS.map((v) => (
            <Link key={v.value} href={keep({ view: v.value })} className={`chip press ${view === v.value ? "chip-on" : ""}`}>
              {v.label}
            </Link>
          ))}
        </div>

        <section className="rise panel sm:p-5" style={{ "--i": 2 } as React.CSSProperties}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted">
                {txs.length} record{txs.length === 1 ? "" : "s"} in {shortMonth(month)}
              </p>
              <p className="tabular mt-0.5 text-[15px]">
                <span className="font-semibold text-red">{cedi(spent)}</span> out,{" "}
                <span className="font-semibold text-green">{cedi(earned)}</span> in
              </p>
            </div>
            <ExportButtons rows={rows} bookName={book.name} month={month} />
          </div>
          <TransactionList
            transactions={txs}
            categories={categories}
            empty={view === "review" ? "Every MoMo record has a category." : "No records match these filters."}
          />
        </section>
      </div>
    </AppShell>
  );
}
