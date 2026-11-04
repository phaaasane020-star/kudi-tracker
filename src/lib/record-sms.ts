import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { feeCategory, guessCategory } from "@/lib/autocat";
import { cedi, today } from "@/lib/format";
import { parseMomoSms } from "@/lib/momo";

export type SmsOutcome = {
  status: "recorded" | "skipped" | "duplicate" | "error";
  detail: string;
  transactionId?: string;
  /** Where the record lives, so the app can link straight to it. */
  where?: { date: string; book: "personal" | "business"; bookName: string };
};

/**
 * Reads one MoMo SMS and records it in the given book. Works with either the
 * signed-in user's client (paste-to-test) or the service client (the webhook).
 * Every message is logged in sms_inbox so nothing disappears silently.
 */
export async function recordSms(
  supabase: SupabaseClient,
  userId: string,
  bookId: string,
  body: string,
  sender: string | null
): Promise<SmsOutcome> {
  const outcome = await process(supabase, userId, bookId, body, sender);
  await supabase.from("sms_inbox").insert({
    user_id: userId,
    sender,
    body: body.slice(0, 1000),
    status: outcome.status,
    detail: outcome.detail,
    transaction_id: outcome.transactionId ?? null,
  });
  // Raw SMS contain your balance, so only keep the last 30 days of them.
  await supabase
    .from("sms_inbox")
    .delete()
    .eq("user_id", userId)
    .lt("received_at", new Date(Date.now() - 30 * 86400_000).toISOString());
  return outcome;
}

async function process(
  supabase: SupabaseClient,
  userId: string,
  bookId: string,
  body: string,
  sender: string | null
): Promise<SmsOutcome> {
  const parsed = parseMomoSms(body, sender ?? undefined);
  if (!parsed.ok) return { status: "skipped", detail: parsed.reason };
  const p = parsed.data;

  if (p.kind === "cashin") {
    return { status: "skipped", detail: `Cash deposit of ${cedi(p.amount)}, not income` };
  }

  const { data: cats, error: catErr } = await supabase
    .from("categories")
    .select("id,name,type,archived")
    .eq("book_id", bookId);
  if (catErr) return { status: "error", detail: catErr.message };

  // A stable reference so the same SMS is never recorded twice.
  const ref = p.txnId
    ? `${p.provider}:${p.txnId}`
    : "sms:" + createHash("sha256").update(body.replace(/\s+/g, " ").trim()).digest("hex").slice(0, 24);

  const date = p.date && p.date <= today() ? p.date : today();
  const { data: bookRow } = await supabase.from("books").select("name,kind").eq("id", bookId).maybeSingle();
  const where = { date, book: (bookRow?.kind ?? "personal") as "personal" | "business", bookName: bookRow?.name ?? "Personal" };
  const place = ` (${new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}, ${where.bookName})`;
  const alreadyThere = async (): Promise<SmsOutcome> => {
    const { data: old } = await supabase
      .from("transactions")
      .select("id,occurred_on,books(name,kind)")
      .eq("user_id", userId)
      .in("reference", [ref, ref + ":fee"])
      .limit(1)
      .maybeSingle();
    const b = (old?.books ?? null) as unknown as { name: string; kind: "personal" | "business" } | null;
    return old
      ? { status: "duplicate", detail: "Already recorded", transactionId: old.id, where: { date: old.occurred_on, book: b?.kind ?? "personal", bookName: b?.name ?? "Personal" } }
      : { status: "duplicate", detail: "Already recorded" };
  };
  const charges = Math.round((p.fee + p.tax) * 100) / 100;
  let mainId: string | undefined;

  if (p.kind === "sent" || p.kind === "received") {
    const type = p.kind === "sent" ? "expense" : "income";
    const hint = [p.counterparty, p.note, body].filter(Boolean).join(" ");
    const categoryId = guessCategory(type, hint, cats ?? []);
    const description = [p.counterparty, p.note].filter(Boolean).join(" — ").slice(0, 200) || p.provider;

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        book_id: bookId,
        category_id: categoryId,
        type,
        amount: p.amount,
        occurred_on: date,
        payment_method: "momo",
        description,
        counterparty: p.counterparty,
        reference: ref,
        source: "sms",
        needs_review: categoryId === null,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") return alreadyThere();
      return { status: "error", detail: error.message };
    }
    mainId = data.id;
  }

  if (charges > 0) {
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      book_id: bookId,
      category_id: feeCategory(cats ?? []),
      type: "expense",
      amount: charges,
      occurred_on: date,
      payment_method: "momo",
      description: `${p.provider} charges${p.kind === "cashout" ? " (cash out)" : ""}`,
      reference: ref + ":fee",
      source: "sms",
      needs_review: false,
    });
    if (error && error.code === "23505" && !mainId) return alreadyThere();
    if (error && error.code !== "23505") return { status: "error", detail: error.message };
  }

  if (p.kind === "cashout") {
    return charges > 0
      ? { status: "recorded", detail: `Cash out of ${cedi(p.amount)}: recorded ${cedi(charges)} in charges${place}`, where }
      : { status: "skipped", detail: `Cash out of ${cedi(p.amount)}, no charges` };
  }

  const verb = p.kind === "sent" ? "Spent" : "Received";
  const extra = charges > 0 ? ` + ${cedi(charges)} charges` : "";
  return {
    status: "recorded",
    detail: `${verb} ${cedi(p.amount)}${p.counterparty ? ` ${p.kind === "sent" ? "to" : "from"} ${p.counterparty}` : ""}${extra}${place}`,
    transactionId: mainId,
    where,
  };
}
