import { redirect } from "next/navigation";
import { Check, Eye, KeyRound, Lock, LogIn, LogOut, MailQuestion, MapPin, ShieldAlert, ShieldCheck, UserCheck, UserMinus, UserPlus, UserX, X } from "lucide-react";
import Link from "next/link";
import { signOutEverywhere } from "@/app/auth-actions";
import AppShell from "@/components/AppShell";
import { loadCategories, loadContext, type PageParams } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { deviceLabel, loggingHealth } from "@/lib/security";

type Event = {
  id: number;
  kind: string;
  email: string | null;
  visitor_id: string | null;
  path: string | null;
  ip: string | null;
  country: string | null;
  city: string | null;
  user_agent: string | null;
  created_at: string;
};

const LABEL: Record<string, string> = {
  signin_success: "Signed in",
  signin_failed: "Wrong password",
  signin_blocked: "Blocked after too many tries",
  signup: "Tried to create an account",
  password_reset_requested: "Asked for a reset link",
  password_changed: "Password changed",
  signout_all: "Signed out everywhere",
  sms_bad_token: "Wrong Auto MoMo link used",
  google_signin: "Signed in with Google",
  member_approved: "You approved someone",
  member_declined: "You declined someone",
  member_removed: "You removed someone's access",
};
const BAD = new Set(["signin_failed", "signin_blocked", "sms_bad_token", "signup"]);

export default async function SecurityPage({ searchParams }: { searchParams: Promise<PageParams> }) {
  const { supabase, book, month, access } = await loadContext(await searchParams);
  const categories = await loadCategories(supabase, book.id);
  const { data: owner } = await supabase.rpc("is_owner");

  if (!owner || !access.isOwner) redirect("/");

  // Keep the log small: visits older than 90 days are removed.
  await supabase.from("security_events").delete().eq("kind", "visit").lt("created_at", new Date(Date.now() - 90 * 86400_000).toISOString());

  const since14 = new Date(Date.now() - 13 * 86400_000);
  since14.setUTCHours(0, 0, 0, 0);
  const since7 = new Date(Date.now() - 7 * 86400_000).toISOString();

  const [health, { data: visits }, { data: events }, signupSetting] = await Promise.all([
    loggingHealth(),
    supabase
      .from("security_events")
      .select("visitor_id,created_at,path,country,city,user_agent")
      .eq("kind", "visit")
      .gte("created_at", since14.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase.from("security_events").select("*").neq("kind", "visit").order("created_at", { ascending: false }).limit(60),
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      cache: "no-store",
    })
      .then((r) => r.json() as Promise<{ disable_signup?: boolean }>)
      .catch(() => null),
  ]);

  const v = (visits ?? []) as Pick<Event, "visitor_id" | "created_at" | "path" | "country" | "city" | "user_agent">[];
  const e = (events ?? []) as Event[];
  const todayKey = new Date().toISOString().slice(0, 10);

  const days = Array.from({ length: 14 }, (_, n) => {
    const d = new Date(since14.getTime() + n * 86400_000).toISOString().slice(0, 10);
    return { d, count: 0 };
  });
  const dayIndex = new Map(days.map((x, n) => [x.d, n]));
  for (const x of v) {
    const n = dayIndex.get(x.created_at.slice(0, 10));
    if (n !== undefined) days[n].count++;
  }
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  const visitsToday = days[days.length - 1].count;
  const visitors7 = new Set(v.filter((x) => x.created_at >= since7).map((x) => x.visitor_id)).size;
  const recent7 = e.filter((x) => x.created_at >= since7);
  const signins = recent7.filter((x) => x.kind === "signin_success" || x.kind === "google_signin").length;
  const failed = recent7.filter((x) => x.kind === "signin_failed" || x.kind === "signin_blocked").length;
  const strangers = recent7.filter((x) => x.kind === "sms_bad_token" || x.kind === "signup").length;
  const alert = failed > 0 || strangers > 0;

  const signupsOff = signupSetting?.disable_signup === true;
  const checks = [
    {
      ok: access.pending === 0,
      text: signupsOff
        ? "New accounts are turned off completely"
        : access.pending === 0
          ? "New accounts need your approval, and nobody is waiting"
          : `${access.pending} new ${access.pending === 1 ? "account is" : "accounts are"} waiting for your approval`,
      fix: "Open People to approve or decline them.",
    },
    { ok: failed === 0, text: failed === 0 ? "No wrong-password attempts this week" : `${failed} wrong-password attempt${failed === 1 ? "" : "s"} this week`, fix: "If these weren’t you, change your password below." },
    { ok: !recent7.some((x) => x.kind === "sms_bad_token"), text: recent7.some((x) => x.kind === "sms_bad_token") ? "Someone used a wrong Auto MoMo link" : "No one has tried a fake Auto MoMo link", fix: "Make a new link on the Auto MoMo page if you think yours leaked." },
  ];

  return (
    <AppShell path="/security" book={book} month={month} categories={categories} title="Security" showMonth={false}>
      <div className="mx-auto max-w-3xl space-y-6">
        {!health.ok && (
          <section className="rise rounded-[20px] border-2 border-red/30 bg-red/5 p-5" role="alert">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-red-dark">
              <ShieldAlert size={22} /> Visits and sign-ins aren&apos;t being recorded
            </h2>
            <p className="mt-2 text-[15px]">{health.problem}</p>
            <p className="mt-2 text-sm text-muted">Until this is fixed, the numbers below stay at zero and the wrong-password lockout can&apos;t count attempts.</p>
          </section>
        )}
        <section className={`rise rounded-[20px] p-5 sm:p-6 ${alert ? "bg-cream" : "bg-brown text-cream"}`}>
          <div className="flex items-start gap-3">
            {alert ? <ShieldAlert className="mt-0.5 shrink-0 text-orange" size={26} /> : <ShieldCheck className="mt-0.5 shrink-0 text-[#4ade80]" size={26} />}
            <div>
              <h2 className="text-lg font-semibold">{alert ? "Something needs a look" : "All quiet"}</h2>
              <p className={`mt-1 text-[15px] ${alert ? "text-muted" : "text-cream/75"}`}>
                {alert
                  ? "There were sign-in attempts or requests this week that weren’t a normal sign-in. Check the list below."
                  : "Only you have signed in this week, and nobody has tried to get in."}
              </p>
            </div>
          </div>
          <dl className={`mt-5 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4 ${alert ? "border-line" : "border-cream/10"}`}>
            <Stat label="Visits today" value={visitsToday} />
            <Stat label="Visitors, 7 days" value={visitors7} />
            <Stat label="Your sign-ins" value={signins} />
            <Stat label="Failed tries" value={failed} warn={failed > 0} />
          </dl>
        </section>

        <section className="panel rise sm:p-5" style={{ ["--i" as string]: 1 }}>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="section-title">Visits, last 14 days</h2>
            <span className="tabular text-sm text-muted">{v.length} page loads</span>
          </div>
          <div className="flex h-32 items-end gap-1.5">
            {days.map((d, n) => (
              <div key={d.d} className="flex h-full flex-1 flex-col justify-end" title={`${d.d}: ${d.count} visits`}>
                <div
                  className={`grow-y rounded-md ${d.d === todayKey ? "bg-brown" : d.count ? "bg-red" : "bg-line"}`}
                  style={{ height: `${Math.max(4, (d.count / maxDay) * 100)}%`, ["--i" as string]: n }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted">
            <span>{new Date(days[0].d).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
            <span>Today</span>
          </div>
        </section>

        <section className="panel rise sm:p-5" style={{ ["--i" as string]: 2 }}>
          <h2 className="section-title mb-3">Safety checklist</h2>
          <ul className="space-y-3">
            {checks.map((c) => (
              <li key={c.text} className="flex gap-3">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${c.ok ? "bg-green/10 text-green" : "bg-red/10 text-red"}`}>
                  {c.ok ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                </span>
                <span>
                  <span className="block text-[15px] font-medium">{c.text}</span>
                  {!c.ok && <span className="block text-sm text-muted">{c.fix}</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link href="/reset" className="btn-soft">
              <KeyRound size={16} /> Change password
            </Link>
            <form action={signOutEverywhere}>
              <button className="btn-soft w-full text-red-dark">
                <LogOut size={16} /> Sign out on all devices
              </button>
            </form>
          </div>
        </section>

        <section className="panel rise sm:p-5" style={{ ["--i" as string]: 3 }}>
          <h2 className="section-title mb-1">Sign-in activity</h2>
          <p className="mb-3 text-sm text-muted">Every sign-in, wrong password, reset request and blocked attempt.</p>
          {e.length === 0 ? (
            <p className="py-4 text-[15px] text-muted">Nothing yet. Sign-in attempts will show up here.</p>
          ) : (
            <ul className="boxed">
              {e.map((x, n) => (
                <li key={x.id} className="row-in flex gap-3 px-4 py-3.5" style={{ ["--i" as string]: Math.min(n, 12) }}>
                  <EventIcon kind={x.kind} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className={`block text-[15px] font-medium ${BAD.has(x.kind) ? "text-red-dark" : ""}`}>{LABEL[x.kind] ?? x.kind}</span>
                        <span className="block truncate text-[13px] text-muted">{x.email ?? (x.kind === "sms_bad_token" ? "Auto MoMo link" : "No email")}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted">{timeAgo(x.created_at)}</span>
                    </div>
                    <Where city={x.city} country={x.country} ua={x.user_agent} ip={x.ip} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel rise sm:p-5" style={{ ["--i" as string]: 4 }}>
          <h2 className="section-title mb-3">Latest visits</h2>
          {v.length === 0 ? (
            <p className="py-4 text-[15px] text-muted">Visits to your app will show up here.</p>
          ) : (
            <ul className="boxed">
              {v.slice(0, 15).map((x, n) => (
                <li key={x.created_at + n} className="row-in flex items-start gap-3 px-4 py-3.5" style={{ ["--i" as string]: Math.min(n, 12) }}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wash text-muted">
                    <Eye size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{pageName(x.path)}</span>
                    <Where city={x.city} country={x.country} ua={x.user_agent} />
                  </span>
                  <span className="shrink-0 text-xs text-muted">{timeAgo(x.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
  return (
    <div>
      <dt className="text-[13px] opacity-70">{label}</dt>
      <dd className={`display tabular mt-0.5 text-3xl font-bold ${warn ? "text-red" : ""}`}>{value}</dd>
    </div>
  );
}

function Where({ city, country, ua, ip }: { city: string | null; country: string | null; ua: string | null; ip?: string | null }) {
  const place = [city, country].filter(Boolean).join(", ");
  return (
    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-muted">
      {place && (
        <span className="inline-flex items-center gap-1">
          <MapPin size={12} /> {place}
        </span>
      )}
      <span>{deviceLabel(ua)}</span>
      {ip && <span className="tabular">{ip}</span>}
    </span>
  );
}

function pageName(path: string | null) {
  const names: Record<string, string> = {
    "/": "Overview",
    "/transactions": "Records",
    "/categories": "Budgets",
    "/settings": "Auto MoMo",
    "/security": "Security",
    "/login": "Login page",
    "/forgot": "Forgot password",
    "/reset": "Change password",
  };
  return names[path ?? ""] ?? path ?? "Page";
}

const EVENT_ICONS: Record<string, { icon: typeof Check; tone: string }> = {
  signin_success: { icon: LogIn, tone: "bg-green/10 text-green" },
  google_signin: { icon: LogIn, tone: "bg-green/10 text-green" },
  signin_failed: { icon: X, tone: "bg-red/10 text-red" },
  signin_blocked: { icon: Lock, tone: "bg-red/10 text-red" },
  signup: { icon: UserPlus, tone: "bg-cream text-orange" },
  password_reset_requested: { icon: MailQuestion, tone: "bg-cream text-orange" },
  password_changed: { icon: KeyRound, tone: "bg-wash text-ink" },
  signout_all: { icon: LogOut, tone: "bg-wash text-ink" },
  sms_bad_token: { icon: ShieldAlert, tone: "bg-red/10 text-red" },
  member_approved: { icon: UserCheck, tone: "bg-green/10 text-green" },
  member_declined: { icon: UserX, tone: "bg-wash text-muted" },
  member_removed: { icon: UserMinus, tone: "bg-wash text-muted" },
};

function EventIcon({ kind }: { kind: string }) {
  const e = EVENT_ICONS[kind] ?? { icon: ShieldCheck, tone: "bg-wash text-muted" };
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${e.tone}`}>
      <e.icon size={16} strokeWidth={2.2} />
    </span>
  );
}
