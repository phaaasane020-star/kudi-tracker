import { setArchived, updateBudget } from "@/app/actions";
import AddCategory from "@/components/AddCategory";
import { deleteCategory } from "@/app/delete-actions";
import AppShell from "@/components/AppShell";
import ConfirmButton from "@/components/ConfirmButton";
import CountUp from "@/components/CountUp";
import { categoryIcon } from "@/lib/category-icons";
import { loadCategories, loadContext, loadMonthTransactions, type PageParams } from "@/lib/data";
import { cedi, shortMonth } from "@/lib/format";
import type { Category } from "@/lib/types";

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<PageParams> }) {
  const { supabase, book, month } = await loadContext(await searchParams);
  const [categories, txs] = await Promise.all([
    loadCategories(supabase, book.id),
    loadMonthTransactions(supabase, book.id, month),
  ]);

  const spentBy = new Map<string, number>();
  for (const t of txs) if (t.category_id) spentBy.set(t.category_id, (spentBy.get(t.category_id) ?? 0) + t.amount);

  const expense = categories.filter((c) => c.type === "expense").sort((a, b) => Number(a.archived) - Number(b.archived));
  const income = categories.filter((c) => c.type === "income").sort((a, b) => Number(a.archived) - Number(b.archived));
  const budgeted = expense.filter((c) => c.monthly_budget && !c.archived);
  const totalBudget = budgeted.reduce((s, c) => s + (c.monthly_budget ?? 0), 0);
  const totalUsed = budgeted.reduce((s, c) => s + (spentBy.get(c.id) ?? 0), 0);

  return (
    <AppShell path="/categories" book={book} month={month} categories={categories} title="Budgets">
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="rise rounded-[20px] bg-cream p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[15px] text-muted">Budgeted for {shortMonth(month)}</p>
              <p className="display mt-1 text-[40px] font-bold leading-none">
                <CountUp value={totalUsed} />
              </p>
              <p className="tabular mt-1.5 text-[15px] text-muted">of {cedi(totalBudget)} across {budgeted.length} categories</p>
            </div>
            <AddCategory bookId={book.id} />
          </div>
          {totalBudget > 0 && (
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white">
              <div
                className={`grow-x h-full rounded-full ${totalUsed > totalBudget ? "bg-red" : "bg-green"}`}
                style={{ width: `${Math.min(100, (totalUsed / totalBudget) * 100)}%` }}
              />
            </div>
          )}
          {totalBudget === 0 && <p className="mt-2 text-[15px]">Type an amount next to a category to give it a monthly limit.</p>}
        </section>

        <section className="panel sm:p-5">
          <h2 className="section-title mb-1">Money out</h2>
          <ul className="divide-y divide-line">
            {expense.map((c, i) => (
              <Row key={c.id} i={i} c={c} spent={spentBy.get(c.id) ?? 0} withBudget />
            ))}
          </ul>
        </section>

        <section className="panel sm:p-5">
          <h2 className="section-title mb-1">Money in</h2>
          <ul className="divide-y divide-line">
            {income.map((c, i) => (
              <Row key={c.id} i={i} c={c} spent={spentBy.get(c.id) ?? 0} />
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

function Row({ c, i, spent, withBudget = false }: { c: Category; i: number; spent: number; withBudget?: boolean }) {
  const over = c.monthly_budget !== null && spent > c.monthly_budget;
  return (
    <li className={`rise py-3.5 ${c.archived ? "opacity-50" : ""}`} style={{ "--i": Math.min(i, 12), "--base": "100ms" } as React.CSSProperties}>
      <div className="flex items-center gap-3">
        <CatIcon name={c.name} color={c.color} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium">{c.name}</p>
          <p className={`tabular text-[13px] ${over ? "font-medium text-red" : "text-muted"}`}>
            {c.archived ? "Hidden from the add form" : `${cedi(spent)} this month${over ? ", over budget" : ""}`}
          </p>
        </div>
        <form action={setArchived}>
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="archived" value={String(!c.archived)} />
          <button className="rounded-lg px-2 py-1 text-[13px] text-muted hover:bg-wash hover:text-ink">{c.archived ? "Show" : "Hide"}</button>
        </form>
        <form action={deleteCategory} title="Its records stay, just without a category">
          <input type="hidden" name="id" value={c.id} />
          <ConfirmButton size="sm" label="Delete" confirmLabel="Delete?" />
        </form>
      </div>

      {withBudget && !c.archived && (
        <form action={updateBudget} className="mt-2.5 flex items-center gap-2 pl-[52px]">
          <input type="hidden" name="id" value={c.id} />
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">GH₵</span>
            <input
              name="monthly_budget"
              inputMode="decimal"
              defaultValue={c.monthly_budget ?? ""}
              placeholder="No limit"
              className="field tabular py-2 pl-12"
              aria-label={`Monthly budget for ${c.name}`}
            />
          </div>
          <button className="btn-soft py-2">Save</button>
        </form>
      )}
    </li>
  );
}

function CatIcon({ name, color }: { name: string; color: string }) {
  const I = categoryIcon(name);
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: color + "1a", color }}>
      <I size={18} strokeWidth={1.9} />
    </span>
  );
}
