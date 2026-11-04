import { ChevronLeft, ChevronRight, LayoutDashboard, LogOut, PieChart, ReceiptText, Smartphone } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/actions";
import AddRecordSheet, { AddButton } from "@/components/AddRecord";
import { currentMonth, monthLabel, nextMonth, prevMonth } from "@/lib/format";
import type { Book, Category } from "@/lib/types";

export type AppPath = "/" | "/transactions" | "/categories" | "/settings";

const NAV: { path: AppPath; label: string; short: string; icon: typeof LayoutDashboard }[] = [
  { path: "/", label: "Overview", short: "Home", icon: LayoutDashboard },
  { path: "/transactions", label: "Records", short: "Records", icon: ReceiptText },
  { path: "/categories", label: "Budgets", short: "Budgets", icon: PieChart },
  { path: "/settings", label: "Auto MoMo", short: "MoMo", icon: Smartphone },
];

export function link(path: string, kind: string, month: string, extra?: Record<string, string>) {
  return `${path}?${new URLSearchParams({ book: kind, month, ...extra })}`;
}

export default function AppShell({
  path,
  book,
  month,
  categories,
  title,
  showMonth = true,
  children,
}: {
  path: AppPath;
  book: Book;
  month: string;
  categories: Category[];
  title: string;
  showMonth?: boolean;
  children: React.ReactNode;
}) {
  const atCurrent = month >= currentMonth();

  const bookSwitch = (
    <div className="grid grid-cols-2 rounded-full bg-wash p-1 text-sm font-semibold">
      {(["personal", "business"] as const).map((k) => (
        <Link
          key={k}
          href={link(path, k, month)}
          className={`rounded-full px-3.5 py-1.5 text-center capitalize transition ${
            book.kind === k ? "bg-brown text-cream" : "text-muted hover:text-ink"
          }`}
        >
          {k}
        </Link>
      ))}
    </div>
  );

  const monthNav = showMonth && (
    <div className="flex items-center gap-1">
      <Link href={link(path, book.kind, prevMonth(month))} className="rounded-full p-2 text-muted hover:bg-wash hover:text-ink" aria-label="Previous month">
        <ChevronLeft size={20} />
      </Link>
      <span className="min-w-[8.5rem] text-center text-[15px] font-semibold">{monthLabel(month)}</span>
      {atCurrent ? (
        <span className="p-2 text-line" aria-hidden>
          <ChevronRight size={20} />
        </span>
      ) : (
        <Link href={link(path, book.kind, nextMonth(month))} className="rounded-full p-2 text-muted hover:bg-wash hover:text-ink" aria-label="Next month">
          <ChevronRight size={20} />
        </Link>
      )}
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      {/* Sidebar on large screens */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-wash px-4 py-6 lg:flex">
        <Brand />
        <div className="mt-6">{bookSwitch}</div>
        <nav className="mt-6 space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.path}
              href={link(n.path, book.kind, month)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition ${
                path === n.path ? "bg-white font-semibold text-ink shadow-sm" : "text-muted hover:bg-white/60 hover:text-ink"
              }`}
            >
              <n.icon size={19} className={path === n.path ? "text-red" : ""} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6">
          <AddButton variant="sidebar" />
        </div>
        <form action={signOut} className="mt-auto">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-white/60 hover:text-ink">
            <LogOut size={18} /> Sign out
          </button>
        </form>
      </aside>

      <div className="min-w-0 pb-28 lg:pb-10">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-line/70 bg-white/90 backdrop-blur-lg">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <Brand compact />
            </div>
            <h1 className="hidden text-2xl font-bold lg:block">{title}</h1>
            <div className="lg:hidden">{bookSwitch}</div>
            <div className="hidden lg:block">{monthNav}</div>
          </div>
          {showMonth && (
            <div className="mx-auto flex max-w-5xl items-center justify-between px-2 pb-2 lg:hidden">
              <h1 className="pl-2 text-xl font-bold">{title}</h1>
              {monthNav}
            </div>
          )}
          {!showMonth && (
            <div className="mx-auto max-w-5xl px-4 pb-3 lg:hidden">
              <h1 className="text-xl font-bold">{title}</h1>
            </div>
          )}
        </header>

        <main className="mx-auto max-w-5xl px-4 py-5 lg:px-8 lg:py-8">{children}</main>
      </div>

      {/* Bottom tabs on phones */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-lg lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pt-2 pb-2">
          {NAV.slice(0, 2).map((n) => (
            <Tab key={n.path} n={n} active={path === n.path} href={link(n.path, book.kind, month)} />
          ))}
          <div className="flex justify-center">
            <AddButton variant="fab" />
          </div>
          {NAV.slice(2).map((n) => (
            <Tab key={n.path} n={n} active={path === n.path} href={link(n.path, book.kind, month)} />
          ))}
        </div>
      </nav>

      <AddRecordSheet bookId={book.id} categories={categories} />
    </div>
  );
}

function Tab({ n, active, href }: { n: (typeof NAV)[number]; active: boolean; href: string }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 py-1 text-[11px] font-medium ${active ? "text-red" : "text-muted"}`}>
      <n.icon size={22} strokeWidth={active ? 2.4 : 1.8} />
      {n.short}
    </Link>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red text-lg font-bold text-white">₵</span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[17px] font-bold">Kudi Tracker</span>
          <span className="block text-xs text-muted">by Paa Asane Technologies</span>
        </span>
      )}
    </div>
  );
}
