import { LogOut } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { rotateSmsToken, signOut, updateSmsSettings } from "@/app/actions";
import AppShell from "@/components/AppShell";
import { CopyField, PasteSms } from "@/components/SmsTools";
import { loadCategories, loadContext, type PageParams } from "@/lib/data";
import { timeAgo } from "@/lib/format";

const STATUS_STYLE: Record<string, string> = {
  recorded: "bg-green/10 text-green",
  duplicate: "bg-wash text-muted",
  skipped: "bg-cream text-ink",
  error: "bg-red/10 text-red-dark",
};

export default async function AutoMomoPage({ searchParams }: { searchParams: Promise<PageParams> }) {
  const { supabase, user, books, book, month } = await loadContext(await searchParams);

  let { data: settings } = await supabase
    .from("sms_settings")
    .select("token,book_id,enabled,last_received_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!settings) {
    const personal = books.find((b) => b.kind === "personal");
    ({ data: settings } = await supabase
      .from("sms_settings")
      .insert({ user_id: user.id, book_id: personal?.id ?? null })
      .select("token,book_id,enabled,last_received_at")
      .single());
  }

  const [categories, { data: inbox }] = await Promise.all([
    loadCategories(supabase, book.id),
    supabase
      .from("sms_inbox")
      .select("id,body,status,detail,received_at,transactions(occurred_on,books(kind,name))")
      .eq("user_id", user.id)
      .order("received_at", { ascending: false })
      .limit(15),
  ]);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const local = host.startsWith("localhost") || host.startsWith("127.");
  const hook = `${proto}://${host}/api/sms?token=${settings?.token ?? ""}`;
  const targetBook = books.find((b) => b.id === settings?.book_id) ?? books.find((b) => b.kind === "personal");
  const enabled = settings?.enabled ?? true;

  return (
    <AppShell path="/settings" book={book} month={month} categories={categories} title="Auto MoMo" showMonth={false}>
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="rise rounded-[20px] bg-brown p-5 text-cream sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2.5 text-lg font-semibold">
                <span className={`h-2 w-2 rounded-full ${enabled ? "ping bg-orange" : "bg-cream/30"}`} />
                {enabled ? "Recording MoMo automatically" : "Automatic recording is paused"}
              </p>
              <p className="mt-1.5 max-w-md text-[15px] text-cream/75">
                {settings?.last_received_at
                  ? `Last message received ${timeAgo(settings.last_received_at)}.`
                  : "Nothing received yet. Set up your phone with the steps below."}{" "}
                Cash you still add yourself with the + button.
              </p>
            </div>
            <form action={updateSmsSettings}>
              <input type="hidden" name="enabled" value={String(!enabled)} />
              <button
                className={`relative h-8 w-14 shrink-0 rounded-full transition ${enabled ? "bg-orange" : "bg-cream/20"}`}
                role="switch"
                aria-checked={enabled}
                aria-label="Automatic recording"
              >
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${enabled ? "left-7" : "left-1"}`} />
              </button>
            </form>
          </div>

          <div className="mt-5 border-t border-cream/10 pt-4">
            <p className="mb-2 text-sm text-cream/60">MoMo records go into</p>
            <div className="flex gap-2">
              {books.map((b) => (
                <form key={b.id} action={updateSmsSettings}>
                  <input type="hidden" name="book_id" value={b.id} />
                  <button
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      targetBook?.id === b.id ? "bg-cream text-brown" : "bg-cream/10 text-cream hover:bg-cream/20"
                    }`}
                  >
                    {b.name}
                  </button>
                </form>
              ))}
            </div>
          </div>
        </section>

        <section className="rise panel space-y-4 sm:p-5" style={{ "--i": 1 } as React.CSSProperties}>
          <div>
            <h2 className="section-title">Your secret link</h2>
            <p className="mt-1 text-[15px] text-muted">Your phone sends each MoMo SMS to this link. Anyone with it can add records, so keep it private.</p>
          </div>
          <CopyField value={hook} label="Link for your SMS forwarding app" />
          {local && (
            <p className="rounded-xl bg-cream px-3.5 py-2.5 text-sm">
              This is a localhost link, so your phone can&apos;t reach it. Deploy to Vercel first, then copy the link from your live site.
            </p>
          )}
          <form action={rotateSmsToken}>
            <button className="text-sm font-medium text-red hover:underline">Make a new link (the old one stops working)</button>
          </form>
        </section>

        <section className="rise panel sm:p-5" style={{ "--i": 2 } as React.CSSProperties}>
          <h2 className="section-title">Set up your phone</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold">Android</h3>
              <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-relaxed">
                <li>
                  Install <b>SMS to URL Forwarder</b> (free) from the Play Store and allow it to read SMS.
                </li>
                <li>
                  Tap <b>+</b>. Under sender, type <b>MobileMoney</b> for MTN. Add another rule for Telecel Cash or AT Money if you use them.
                </li>
                <li>Paste your secret link as the webhook URL and keep the default message template.</li>
                <li>Save, then turn off battery saving for the app so it keeps working in the background.</li>
              </ol>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">iPhone</h3>
              <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-relaxed">
                <li>
                  Open <b>Shortcuts</b>, go to <b>Automation</b>, tap <b>+</b>, then choose <b>Message</b>.
                </li>
                <li>
                  Set sender to <b>MobileMoney</b>, then choose <b>Run Immediately</b>.
                </li>
                <li>
                  Add <b>Get Contents of URL</b>. Paste your link, set method to <b>POST</b> and request body to <b>JSON</b>.
                </li>
                <li>
                  Add a field <b>text</b> = Shortcut Input → Content, and <b>from</b> = Sender.
                </li>
              </ol>
            </div>
          </div>
          <p className="mt-5 text-sm text-muted">
            Payments and transfers become money out, and money received becomes money in. MoMo fees and e-levy go under MoMo Charges.
            Cash outs only record the fee, because you record what you spend that cash on yourself.
          </p>
        </section>

        <section className="rise panel sm:p-5" style={{ "--i": 3 } as React.CSSProperties}>
          <h2 className="section-title">Record a message by pasting it</h2>
          <p className="mb-3 mt-1 text-[15px] text-muted">
            Copy a MoMo SMS from your messages and paste it here. It&apos;s also the quickest way to check the app reads your messages correctly.
          </p>
          <PasteSms bookId={targetBook?.id ?? book.id} />
        </section>

        <section className="rise panel sm:p-5" style={{ "--i": 4 } as React.CSSProperties}>
          <h2 className="section-title mb-3">Messages received</h2>
          {!inbox || inbox.length === 0 ? (
            <p className="text-[15px] text-muted">Messages from your phone will show up here.</p>
          ) : (
            <ul className="boxed">
              {inbox.map((m, n) => (
                <li key={m.id} className="row-in px-4 py-3.5" style={{ ["--i" as string]: Math.min(n, 12) }}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[m.status]}`}>{m.status}</span>
                    <span className="text-xs text-muted">{timeAgo(m.received_at)}</span>
                  </div>
                  <p className="mt-1.5 text-[15px]">{m.detail}</p>
                  <p className="mt-1 line-clamp-2 text-[13px] text-muted">{m.body}</p>
                  {(() => {
                    const t = m.transactions as unknown as { occurred_on: string; books: { kind: string; name: string } | null } | null;
                    if (!t) return null;
                    return (
                      <Link
                        href={`/transactions?book=${t.books?.kind ?? "personal"}&month=${t.occurred_on.slice(0, 7)}`}
                        className="mt-2 inline-flex text-sm font-semibold text-red hover:underline"
                      >
                        See it in Records
                      </Link>
                    );
                  })()}
                </li>
              ))}
            </ul>
          )}
        </section>

        <form action={signOut} className="lg:hidden">
          <button className="btn-soft w-full">
            <LogOut size={16} /> Sign out
          </button>
        </form>
      </div>
    </AppShell>
  );
}
