import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import CountUp from "@/components/CountUp";
import { categoryIcon } from "@/lib/category-icons";
import Link from "next/link";
import { AddButton } from "@/components/AddRecord";
import AppShell, { link } from "@/components/AppShell";
import DailyChart from "@/components/DailyChart";
import TransactionList from "@/components/TransactionList";
import { loadCategories, loadContext, loadMonthTransactions, type PageParams } from "@/lib/data";
import { cedi, currentMonth, daysInMonth, shortMonth, timeAgo, today } from "@/lib/format";

export default async function Overview({ searchParams }: { searchParams: Promise<PageParams> }) {
  const { supabase, user, book, month } = await loadContext(await searchParams);
  const [categories, txs, { data: sms }] = await Promise.all([
    loadCategories(supabase, book.id),
    loadMonthTransactions(supabase, book.id, month),
    supabase.from("sms_settings").select("enabled,last_received_at,book_id").eq("user_id", user.id).maybeSingle(),
  ]);

  const expenses = txs.filter((t) => t.type === "expense");
  const spent = expenses.reduce((s, t) => s + t.amount, 0);
  const earned = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const left = earned - spent;
  const auto = txs.filter((t) => t.source === "sms").length;
  const review = txs.filter((t) => t.needs_review).length;

  const days = daysInMonth(month);
  const isCurrent = month === currentMonth();
  const todayNum = isCurrent ? Number(today().slice(8, 10)) : null;
  const daily = Array.from({ length: days }, (_, i) => ({ day: i + 1, amount: 0 }));
  for (const t of expenses) daily[Number(t.occurred_on.slice(8, 10)) - 1].amount += t.amount;
  const perDay = spent / (todayNum ?? days);

  const totals = new Map<string, number>();
  for (const t of expenses) totals.set(t.category_id ?? "none", (totals.get(t.category_id ?? "none") ?? 0) + t.amount);
  const rows = categories
    .filter((c) => c.type === "expense" && (totals.has(c.id) || (c.monthly_budget && !c.archived)))
    .map((c) => ({ id: c.id, name: c.name, color: c.color, amount: totals.get(c.id) ?? 0, budget: c.monthly_budget }));
  if (totals.has("none")) rows.push({ id: "none", name: "No category", color: "#c9b8b0", amount: totals.get("none")!, budget: null });
  rows.sort((a, b) => b.amount - a.amount);

  const autoOn = sms?.enabled && sms.last_received_at;

  return (
    <AppShell path="/" book={book} month={month} categories={categories} title="Overview">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          {/* The month at a glance */}
          <section data-tour="hero" className="rise relative isolate overflow-hidden rounded-[20px] bg-brown p-5 text-cream sm:p-6">
            <div aria-hidden className="float-slow pointer-events-none absolute -z-10 -right-16 -top-20 h-56 w-56 rounded-full bg-red/25 blur-3xl" />
            <div aria-hidden className="float-slow pointer-events-none absolute -z-10 -bottom-24 left-10 h-48 w-48 rounded-full bg-orange/15 blur-3xl [animation-delay:-3s]" />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="shrink-0 text-[15px] text-cream/75">Spent in {shortMonth(month)}</p>
              {autoOn ? (
                <span className="flex items-center gap-1.5 text-xs text-cream/60">
                  <span className="ping h-1.5 w-1.5 rounded-full bg-orange" /> MoMo synced {timeAgo(sms.last_received_at!)}
                </span>
              ) : null}
            </div>
            <p className="display mt-2 text-[52px] font-bold leading-none sm:text-[64px]">
              <CountUp value={spent} />
            </p>

            {spent > 0 ? (
              <div className="grow-x relative mt-5 flex h-2.5 gap-[3px] overflow-hidden rounded-full" aria-hidden>
                {rows
                  .filter((r) => r.amount > 0)
                  .map((r) => (
                    <span key={r.id} style={{ flexGrow: r.amount, background: r.color }} className="min-w-[3px] first:rounded-l-full last:rounded-r-full" />
                  ))}
              </div>
            ) : (
              <div className="mt-5 h-2.5 rounded-full bg-cream/10" />
            )}

            <dl className="relative mt-5 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-cream/10 pt-4 text-sm min-[400px]:grid-cols-3">
              <div>
                <dt className="flex items-center gap-1 text-cream/60">
                  <ArrowDownLeft size={14} className="text-[#4ade80]" /> In
                </dt>
                <dd className="tabular mt-0.5 font-semibold">{cedi(earned)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-cream/60">
                  <ArrowUpRight size={14} className="text-red" /> Left
                </dt>
                <dd className={`tabular mt-0.5 font-semibold ${left < 0 ? "text-[#fca5a5]" : ""}`}>
                  {left < 0 ? "−" : ""}
                  {cedi(Math.abs(left))}
                </dd>
              </div>
              <div>
                <dt className="text-cream/60">Per day</dt>
                <dd className="tabular mt-0.5 font-semibold">{cedi(perDay)}</dd>
              </div>
            </dl>
          </section>

          {review > 0 && (
            <Link
              href={link("/transactions", book.kind, month, { view: "review" })}
              className="rise lift press flex items-center gap-3 rounded-xl border-l-[3px] border-orange bg-cream px-4 py-3.5 hover:bg-[#ffe9c7]"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              <span className="flex-1 text-[15px]">
                <span className="font-semibold">
                  {review} MoMo record{review === 1 ? "" : "s"}
                </span>{" "}
                need{review === 1 ? "s" : ""} a category
              </span>
              <ChevronRight size={18} className="text-muted" />
            </Link>
          )}

          {!sms?.last_received_at && (
            <Link
              href={link("/settings", book.kind, month)}
              className="rise lift press flex items-center gap-3 rounded-xl bg-wash px-4 py-3.5 hover:bg-cream"
              style={{ "--i": 3 } as React.CSSProperties}
            >
              <span className="flex-1 text-[15px]">
                <span className="block font-semibold">Record MoMo payments automatically</span>
                <span className="block text-sm text-muted">Takes about two minutes to set up on your phone</span>
              </span>
              <ChevronRight size={18} className="text-muted" />
            </Link>
          )}

          <section className="rise panel sm:p-5" style={{ "--i": 4 } as React.CSSProperties}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="section-title">Day by day</h2>
              <span className="tabular text-sm text-muted">{expenses.length} payments</span>
            </div>
            <DailyChart data={daily} today={todayNum} />
          </section>

          <section className="rise panel sm:p-5" style={{ "--i": 6 } as React.CSSProperties}>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="section-title">Where it went</h2>
              <Link href={link("/categories", book.kind, month)} className="text-sm font-medium text-red hover:underline">
                Budgets
              </Link>
            </div>
            {rows.length === 0 ? (
              <p className="py-4 text-[15px] text-muted">Your categories show up here after your first payment.</p>
            ) : (
              <ul className="space-y-4">
                {rows.map((r, i) => {
                  const over = r.budget !== null && r.amount > r.budget;
                  const pct = r.budget ? Math.min(100, (r.amount / r.budget) * 100) : spent ? (r.amount / spent) * 100 : 0;
                  return (
                    <li key={r.id}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2.5 text-[15px] font-medium">
                          <Icon name={r.name} color={r.color} />
                          <span className="truncate">{r.name}</span>
                        </span>
                        <span className="tabular shrink-0 text-[15px]">
                          <span className={`font-semibold ${over ? "text-red" : ""}`}>{cedi(r.amount)}</span>
                          {r.budget !== null && <span className="text-sm text-muted"> of {cedi(r.budget)}</span>}
                        </span>
                      </div>
                      <div className="ml-[34px] h-1.5 overflow-hidden rounded-full bg-wash">
                        <div className="grow-x h-full rounded-full" style={{ width: `${pct}%`, background: over ? "#ef4444" : r.color, "--i": i + 4 } as React.CSSProperties} />
                      </div>
                      {over && <p className="ml-[34px] mt-1 text-[13px] font-medium text-red">{cedi(r.amount - r.budget!)} over budget</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <section className="rise panel h-fit sm:p-5" style={{ "--i": 3 } as React.CSSProperties}>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="section-title">Latest</h2>
            <Link href={link("/transactions", book.kind, month)} className="text-sm font-medium text-red hover:underline">
              All records
            </Link>
          </div>
          {auto > 0 && (
            <p className="mb-2 text-sm text-muted">
              {auto} of {txs.length} recorded automatically from MoMo
            </p>
          )}
          <TransactionList
            transactions={txs.slice(0, 10)}
            categories={categories}
            dayTotals={false}
            empty={
              <div className="space-y-3">
                <p>Nothing recorded in {shortMonth(month)}.</p>
                <AddButton variant="inline" />
              </div>
            }
          />
        </section>
      </div>
    </AppShell>
  );
}

function Icon({ name, color }: { name: string; color: string }) {
  const I = categoryIcon(name);
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: color + "1a", color }}>
      <I size={13} strokeWidth={2.2} />
    </span>
  );
}
