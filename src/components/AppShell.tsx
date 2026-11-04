import { ChevronLeft, ChevronRight, LayoutDashboard, LogOut, PieChart, ReceiptText, ShieldCheck, Smartphone, Users } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/actions";
import Footer from "@/components/Footer";
import AddRecordSheet, { AddButton } from "@/components/AddRecord";
import { currentMonth, monthLabel, nextMonth, prevMonth } from "@/lib/format";
import { getAccess } from "@/lib/access";
import type { Book, Category } from "@/lib/types";

export type AppPath = "/" | "/transactions" | "/categories" | "/settings" | "/security" | "/people";

const NAV: { path: AppPath; label: string; short: string; icon: typeof LayoutDashboard }[] = [
  { path: "/", label: "Overview", short: "Home", icon: LayoutDashboard },
  { path: "/transactions", label: "Records", short: "Records", icon: ReceiptText },
  { path: "/categories", label: "Budgets", short: "Budgets", icon: PieChart },
  { path: "/settings", label: "Auto MoMo", short: "MoMo", icon: Smartphone },
];
const SECURITY = { path: "/security" as AppPath, label: "Security", short: "Security", icon: ShieldCheck };
const PEOPLE = { path: "/people" as AppPath, label: "People", short: "People", icon: Users };

export function link(path: string, kind: string, month: string, extra?: Record<string, string>) {
  return `${path}?${new URLSearchParams({ book: kind, month, ...extra })}`;
}

export default async function AppShell({
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
  const access = await getAccess();
  const SIDEBAR = access.isOwner ? [...NAV, PEOPLE, SECURITY] : [...NAV, SECURITY];

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
      <span className="min-w-[5.5rem] text-center text-sm font-semibold sm:min-w-[8.5rem] sm:text-[15px]">
        <span className="sm:hidden">{monthShort(month)}</span>
        <span className="hidden sm:inline">{monthLabel(month)}</span>
      </span>
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
          {SIDEBAR.map((n) => (
            <Link
              key={n.path}
              href={link(n.path, book.kind, month)}
              className={`press flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] ${
                path === n.path ? "bg-white font-semibold text-ink shadow-sm" : "text-muted hover:bg-white/60 hover:text-ink"
              }`}
            >
              <n.icon size={19} className={path === n.path ? "text-red" : ""} />
              <span className="flex-1">{n.label}</span>
              {n.path === "/people" && access.pending > 0 && (
                <span className="pop rounded-full bg-red px-2 py-0.5 text-xs font-bold text-white">{access.pending}</span>
              )}
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

      <div className="flex min-h-dvh min-w-0 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-line/70 bg-white/90 backdrop-blur-lg">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <Brand compact />
            </div>
            <h1 className="hidden text-2xl font-bold lg:block">{title}</h1>
            <div className="flex items-center gap-1.5 lg:hidden">
              {bookSwitch}
              {access.isOwner && (
                <Link
                  href={link("/people", book.kind, month)}
                  aria-label={access.pending ? `People, ${access.pending} waiting` : "People"}
                  className={`press relative rounded-full p-2 ${path === "/people" ? "bg-cream text-red" : "text-muted hover:bg-wash hover:text-ink"}`}
                >
                  <Users size={20} />
                  {access.pending > 0 && (
                    <span className="pop absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">
                      {access.pending}
                    </span>
                  )}
                </Link>
              )}
              <Link
                href={link("/security", book.kind, month)}
                aria-label="Security"
                className={`press rounded-full p-2 ${path === "/security" ? "bg-cream text-red" : "text-muted hover:bg-wash hover:text-ink"}`}
              >
                <ShieldCheck size={20} />
              </Link>
            </div>
            <div className="hidden lg:block">{monthNav}</div>
          </div>
          {showMonth && (
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-2 pb-2 lg:hidden">
              <h1 className="truncate pl-2 text-xl font-bold">{title}</h1>
              {monthNav}
            </div>
          )}
          {!showMonth && (
            <div className="mx-auto max-w-5xl px-4 pb-3 lg:hidden">
              <h1 className="text-xl font-bold">{title}</h1>
            </div>
          )}
        </header>

        <main className="page-enter mx-auto w-full max-w-5xl flex-1 px-4 py-5 lg:px-8 lg:py-8">{children}</main>
        <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <Footer />
        </div>
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
    <Link href={href} className={`press relative flex flex-col items-center gap-1 py-1 text-[11px] font-medium ${active ? "tab-active text-red" : "text-muted"}`}>
      <n.icon size={22} strokeWidth={active ? 2.4 : 1.8} />
      {n.short}
      <span className={`tab-dot absolute -bottom-1 h-1 w-1 rounded-full bg-red ${active ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
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
          <a href="https://paatech.vercel.app" target="_blank" rel="noopener noreferrer" className="block text-xs text-muted hover:text-red hover:underline">
            by Paa Asane Technologies
          </a>
        </span>
      )}
    </div>
  );
}

function monthShort(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}
