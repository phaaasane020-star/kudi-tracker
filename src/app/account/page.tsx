import { CircleCheck, KeyRound, LogOut, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/actions";
import { signOutEverywhere } from "@/app/auth-actions";
import { clearInbox, deleteAccount, deleteRecords } from "@/app/delete-actions";
import AppShell, { link } from "@/components/AppShell";
import ConfirmButton from "@/components/ConfirmButton";
import { loadCategories, loadContext, type PageParams } from "@/lib/data";
import { monthLabel, monthRange } from "@/lib/format";

const DELETED: Record<string, string> = {
  month: "Done. Those records are deleted.",
  book: "Done. Every record in that book is deleted.",
  all: "Done. All your records and received MoMo messages are deleted.",
};
const ERRORS: Record<string, string> = {
  "type-delete": "Type DELETE in the box first, then tap the button twice.",
  owner: "As the owner, you can't delete your account here. See the note under Delete my account.",
  server: "The account couldn't be deleted right now. Check that SUPABASE_SERVICE_ROLE_KEY is set in Vercel, then try again.",
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<PageParams & { deleted?: string; error?: string }> }) {
  const params = await searchParams;
  const { supabase, user, book, books, month, access } = await loadContext(params);
  const { start, end } = monthRange(month);

  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);
  const [categories, inMonth, inBook, inAll, inInbox] = await Promise.all([
    loadCategories(supabase, book.id),
    count(supabase.from("transactions").select("id", { count: "exact", head: true }).eq("book_id", book.id).gte("occurred_on", start).lt("occurred_on", end)),
    count(supabase.from("transactions").select("id", { count: "exact", head: true }).eq("book_id", book.id)),
    count(supabase.from("transactions").select("id", { count: "exact", head: true }).eq("user_id", user.id)),
    count(supabase.from("sms_inbox").select("id", { count: "exact", head: true }).eq("user_id", user.id)),
  ]);
  const notice = params.deleted ? DELETED[params.deleted] : "";
  const error = params.error ? ERRORS[params.error] : "";
  const n = (x: number) => `${x} record${x === 1 ? "" : "s"}`;

  return (
    <AppShell path="/account" book={book} month={month} categories={categories} title="Account & data" showMonth={false}>
      <div className="mx-auto max-w-3xl space-y-6">
        {notice && (
          <p className="pop flex items-center gap-2 rounded-2xl bg-green/10 px-4 py-3 text-[15px] text-green" role="status">
            <CircleCheck size={18} /> {notice}
          </p>
        )}
        {error && (
          <p className="pop flex items-center gap-2 rounded-2xl bg-red/10 px-4 py-3 text-[15px] text-red-dark" role="alert">
            <TriangleAlert size={18} /> {error}
          </p>
        )}

        <section className="panel rise sm:p-5">
          <h2 className="section-title">Your account</h2>
          <p className="mt-1 text-[15px] text-muted">
            Signed in as <b className="text-ink">{user.email}</b>
            {access.isOwner ? ", the owner of this Kudi Tracker." : "."}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link href="/reset" className="btn-soft">
              <KeyRound size={16} /> Change password
            </Link>
            <form action={signOutEverywhere}>
              <button className="btn-soft w-full">
                <LogOut size={16} /> Sign out on all devices
              </button>
            </form>
            <form action={signOut}>
              <button className="btn-soft w-full">
                <LogOut size={16} /> Sign out
              </button>
            </form>
          </div>
        </section>

        <section className="panel rise sm:p-5" style={{ ["--i" as string]: 1 }}>
          <h2 className="section-title">Delete records</h2>
          <p className="mt-1 text-[15px] text-muted">
            Deleted records can&apos;t be brought back. To delete just one record, tap it in Records and choose Delete. To work on the other book, switch to{" "}
            {books
              .filter((b) => b.id !== book.id)
              .map((b) => (
                <Link key={b.id} href={link("/account", b.kind, month)} className="font-semibold text-red hover:underline">
                  {b.name}
                </Link>
              ))}{" "}
            at the top.
          </p>
          <ul className="boxed mt-4">
            <DeleteRow
              title={`${monthLabel(month)} in ${book.name}`}
              note={inMonth ? n(inMonth) : "Nothing to delete"}
              scope="month"
              bookId={book.id}
              month={month}
              disabled={!inMonth}
              label="Delete this month"
            />
            <DeleteRow
              title={`Everything in ${book.name}`}
              note={inBook ? `${n(inBook)}, every month` : "Nothing to delete"}
              scope="book"
              bookId={book.id}
              month={month}
              disabled={!inBook}
              label={`Delete all ${book.name}`}
            />
            <DeleteRow
              title="Everything in both books"
              note={inAll ? `${n(inAll)}, plus received MoMo messages. Your categories and budgets stay.` : "Nothing to delete"}
              scope="all"
              bookId={book.id}
              month={month}
              disabled={!inAll}
              label="Delete all records"
            />
          </ul>
        </section>

        <section className="panel rise sm:p-5" style={{ ["--i" as string]: 2 }}>
          <h2 className="section-title">Delete received MoMo messages</h2>
          <p className="mt-1 text-[15px] text-muted">
            Clears the list on the MoMo Sync page ({inInbox} message{inInbox === 1 ? "" : "s"}). Records made from them stay. You can also delete one message at a time there.
          </p>
          <form action={clearInbox} className="mt-4">
            <ConfirmButton label="Delete all messages" disabled={!inInbox} />
          </form>
          <p className="mt-4 text-sm text-muted">
            Categories are deleted on the{" "}
            <Link href={link("/categories", book.kind, month)} className="font-semibold text-red hover:underline">
              Budgets
            </Link>{" "}
            page.
          </p>
        </section>

        <section className="rise rounded-[20px] border-2 border-red/25 p-5" style={{ ["--i" as string]: 3 }}>
          <h2 className="section-title text-red-dark">Delete my account</h2>
          {access.isOwner ? (
            <p className="mt-1 text-[15px] text-muted">
              You&apos;re the owner, so deleting your account here would hand control of this Kudi Tracker to the next person who signed up. To start
              completely fresh, delete your records above. To remove the app entirely, delete the project in Supabase and Vercel.
            </p>
          ) : (
            <form action={deleteAccount} className="mt-1 space-y-3">
              <p className="text-[15px] text-muted">
                This removes your account and everything in it: every record, category, budget, MoMo link and message. It can&apos;t be undone.
              </p>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Type DELETE to confirm</span>
                <input name="confirm" autoComplete="off" autoCapitalize="characters" className="field max-w-xs" placeholder="DELETE" />
              </label>
              <ConfirmButton label="Delete my account forever" confirmLabel="Tap again: delete forever" />
            </form>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function DeleteRow({
  title,
  note,
  scope,
  bookId,
  month,
  disabled,
  label,
}: {
  title: string;
  note: string;
  scope: string;
  bookId: string;
  month: string;
  disabled: boolean;
  label: string;
}) {
  return (
    <li className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <span>
        <span className="block text-[15px] font-medium">{title}</span>
        <span className="block text-[13px] text-muted">{note}</span>
      </span>
      <form action={deleteRecords}>
        <input type="hidden" name="scope" value={scope} />
        <input type="hidden" name="book_id" value={bookId} />
        <input type="hidden" name="month" value={month} />
        <ConfirmButton label={label} disabled={disabled} />
      </form>
    </li>
  );
}
