import { Check, UserMinus, X } from "lucide-react";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { loadCategories, loadContext, type PageParams } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { decideMember } from "./actions";

type Member = { user_id: string; email: string | null; status: "pending" | "approved" | "declined"; requested_at: string; decided_at: string | null };

export default async function PeoplePage({ searchParams }: { searchParams: Promise<PageParams> }) {
  const { supabase, user, book, month, access } = await loadContext(await searchParams);
  if (!access.isOwner) redirect("/");
  const [categories, { data }] = await Promise.all([
    loadCategories(supabase, book.id),
    supabase.from("members").select("user_id,email,status,requested_at,decided_at").order("requested_at", { ascending: false }),
  ]);
  const members = (data ?? []) as Member[];
  const waiting = members.filter((m) => m.status === "pending");
  const approved = members.filter((m) => m.status === "approved");
  const declined = members.filter((m) => m.status === "declined");

  return (
    <AppShell path="/people" book={book} month={month} categories={categories} title="People" showMonth={false}>
      <div className="mx-auto max-w-3xl space-y-6">
        <section className={`rise rounded-[20px] p-5 sm:p-6 ${waiting.length ? "bg-cream" : "bg-wash"}`}>
          <h2 className="text-lg font-semibold">
            {waiting.length ? `${waiting.length} ${waiting.length === 1 ? "person is" : "people are"} waiting for you` : "Nobody is waiting"}
          </h2>
          <p className="mt-1 text-[15px] text-muted">
            New accounts can&apos;t see or record anything until you approve them. Each person only ever sees their own money, never yours.
          </p>
        </section>

        {waiting.length > 0 && (
          <Group title="Waiting for approval" i={1}>
            {waiting.map((m, n) => (
              <Row key={m.user_id} m={m} n={n} note={`Asked ${timeAgo(m.requested_at)}`}>
                <Decide id={m.user_id} decision="declined" label="Decline" icon={<X size={16} />} primary={false} />
                <Decide id={m.user_id} decision="approved" label="Approve" icon={<Check size={16} />} primary />
              </Row>
            ))}
          </Group>
        )}

        <Group title="Can use Kudi" i={2}>
          {approved.map((m, n) => (
            <Row key={m.user_id} m={m} n={n} note={m.user_id === user.id ? "You, the owner" : `Approved ${m.decided_at ? timeAgo(m.decided_at) : ""}`}>
              {m.user_id !== user.id && <Decide id={m.user_id} decision="declined" label="Remove access" icon={<UserMinus size={16} />} primary={false} />}
            </Row>
          ))}
        </Group>

        {declined.length > 0 && (
          <Group title="Declined or removed" i={3}>
            {declined.map((m, n) => (
              <Row key={m.user_id} m={m} n={n} note={m.decided_at ? `Decided ${timeAgo(m.decided_at)}` : ""}>
                <Decide id={m.user_id} decision="approved" label="Approve" icon={<Check size={16} />} primary={false} />
              </Row>
            ))}
          </Group>
        )}
      </div>
    </AppShell>
  );
}

function Group({ title, i, children }: { title: string; i: number; children: React.ReactNode }) {
  return (
    <section className="panel rise sm:p-5" style={{ ["--i" as string]: i }}>
      <h2 className="section-title mb-2">{title}</h2>
      <ul className="boxed">{children}</ul>
    </section>
  );
}

function Row({ m, n, note, children }: { m: Member; n: number; note: string; children?: React.ReactNode }) {
  const initial = (m.email ?? "?").charAt(0).toUpperCase();
  return (
    <li className="row-in flex flex-wrap items-center gap-3 px-4 py-3.5" style={{ ["--i" as string]: n }}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brown text-[15px] font-semibold text-cream">{initial}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{m.email ?? "No email"}</span>
        <span className="block text-[13px] text-muted">{note}</span>
      </span>
      {children && <span className="flex w-full gap-2 pl-[52px] sm:w-auto sm:pl-0">{children}</span>}
    </li>
  );
}

function Decide({ id, decision, label, icon, primary }: { id: string; decision: string; label: string; icon: React.ReactNode; primary: boolean }) {
  return (
    <form action={decideMember} className="flex-1 sm:flex-none">
      <input type="hidden" name="user_id" value={id} />
      <input type="hidden" name="decision" value={decision} />
      <button className={`${primary ? "btn py-2.5" : "btn-soft"} w-full`}>
        {icon} {label}
      </button>
    </form>
  );
}
