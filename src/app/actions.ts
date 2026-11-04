"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifiedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PAYMENT_METHODS } from "@/lib/format";

export type FormState = { ok: boolean; message: string; stamp: number; href?: string; hrefLabel?: string };

const fail = (message: string): FormState => ({ ok: false, message, stamp: Date.now() });
const done = (message: string): FormState => ({ ok: true, message, stamp: Date.now() });

async function requireUser() {
  const supabase = await createClient();
  const user = await verifiedUser(supabase);
  if (!user) redirect("/login");
  return { supabase, user };
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function addTransaction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();

  const type = str(fd, "type");
  const bookId = str(fd, "book_id");
  const categoryId = str(fd, "category_id");
  const amount = Number(str(fd, "amount").replace(/,/g, ""));
  const occurredOn = str(fd, "occurred_on");
  const paymentMethod = str(fd, "payment_method");
  const description = str(fd, "description");

  if (type !== "expense" && type !== "income") return fail("Choose expense or income.");
  if (!bookId) return fail("Missing book.");
  if (!Number.isFinite(amount) || amount <= 0) return fail("Enter an amount greater than 0.");
  if (amount > 9_999_999_999) return fail("That amount is too large.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) return fail("Pick a valid date.");
  if (!PAYMENT_METHODS.some((p) => p.value === paymentMethod)) return fail("Pick a payment method.");
  if (description.length > 200) return fail("Keep the note under 200 characters.");

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    book_id: bookId,
    category_id: categoryId || null,
    type,
    amount: Math.round(amount * 100) / 100,
    occurred_on: occurredOn,
    payment_method: paymentMethod,
    description: description || null,
  });
  if (error) return fail("Could not save: " + error.message);

  revalidatePath("/", "layout");
  return done(type === "expense" ? "Expense saved" : "Income saved");
}

export async function deleteTransaction(fd: FormData) {
  const { supabase } = await requireUser();
  const id = str(fd, "id");
  if (id) await supabase.from("transactions").delete().eq("id", id);
  revalidatePath("/", "layout");
}

export async function addCategory(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();

  const bookId = str(fd, "book_id");
  const name = str(fd, "name");
  const type = str(fd, "type");
  const color = str(fd, "color") || "#6B7F72";
  const budgetRaw = str(fd, "monthly_budget");
  const budget = budgetRaw ? Number(budgetRaw) : null;

  if (!name || name.length > 60) return fail("Name must be 1–60 characters.");
  if (type !== "expense" && type !== "income") return fail("Choose expense or income.");
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return fail("Pick a valid colour.");
  if (budget !== null && (!Number.isFinite(budget) || budget < 0)) return fail("Budget must be 0 or more.");

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    book_id: bookId,
    name,
    type,
    color,
    monthly_budget: type === "expense" ? budget : null,
  });
  if (error) {
    if (error.code === "23505") return fail(`You already have a "${name}" category.`);
    return fail("Could not save: " + error.message);
  }

  revalidatePath("/", "layout");
  return done(`Added "${name}"`);
}

export async function updateBudget(fd: FormData) {
  const { supabase } = await requireUser();
  const id = str(fd, "id");
  const raw = str(fd, "monthly_budget");
  const budget = raw ? Number(raw) : null;
  if (!id || (budget !== null && (!Number.isFinite(budget) || budget < 0))) return;
  await supabase.from("categories").update({ monthly_budget: budget }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function setArchived(fd: FormData) {
  const { supabase } = await requireUser();
  const id = str(fd, "id");
  const archived = str(fd, "archived") === "true";
  if (id) await supabase.from("categories").update({ archived }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function updateTransaction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const id = str(fd, "id");
  const categoryId = str(fd, "category_id");
  const description = str(fd, "description");
  const amount = Number(str(fd, "amount").replace(/,/g, ""));
  const occurredOn = str(fd, "occurred_on");
  const paymentMethod = str(fd, "payment_method");

  if (!id) return fail("Missing record.");
  if (!Number.isFinite(amount) || amount <= 0) return fail("Enter an amount greater than 0.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) return fail("Pick a valid date.");
  if (!PAYMENT_METHODS.some((p) => p.value === paymentMethod)) return fail("Pick a payment method.");
  if (description.length > 200) return fail("Keep the note under 200 characters.");

  const { error } = await supabase
    .from("transactions")
    .update({
      category_id: categoryId || null,
      description: description || null,
      amount: Math.round(amount * 100) / 100,
      occurred_on: occurredOn,
      payment_method: paymentMethod,
      needs_review: false,
    })
    .eq("id", id);
  if (error) return fail("Could not save: " + error.message);

  revalidatePath("/", "layout");
  return done("Changes saved");
}

/** Paste a MoMo SMS into the app to record it (also how you test the reader). */
export async function importSms(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const text = str(fd, "text").slice(0, 2000);
  const bookId = str(fd, "book_id");
  if (!text) return fail("Paste a MoMo message first.");

  const { recordSms } = await import("@/lib/record-sms");
  const out = await recordSms(supabase, user.id, bookId, text, "pasted");
  revalidatePath("/", "layout");
  const href = out.where ? `/transactions?book=${out.where.book}&month=${out.where.date.slice(0, 7)}` : undefined;
  const label = out.where
    ? `See it in ${out.where.bookName}, ${new Date(out.where.date + "T00:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}`
    : undefined;
  if (out.status === "recorded") return { ...done(out.detail), href, hrefLabel: label };
  if (out.status === "duplicate") return { ...fail("That message is already recorded."), href, hrefLabel: label };
  return fail(out.status === "skipped" ? `Skipped: ${out.detail}` : out.detail);
}

export async function rotateSmsToken() {
  const { supabase, user } = await requireUser();
  const { randomBytes } = await import("node:crypto");
  await supabase
    .from("sms_settings")
    .upsert({ user_id: user.id, token: randomBytes(24).toString("hex") }, { onConflict: "user_id" });
  revalidatePath("/settings");
}

export async function updateSmsSettings(fd: FormData) {
  const { supabase, user } = await requireUser();
  const bookId = str(fd, "book_id");
  const enabled = str(fd, "enabled");
  const patch: Record<string, unknown> = { user_id: user.id };
  if (bookId) patch.book_id = bookId;
  if (enabled) patch.enabled = enabled === "true";
  await supabase.from("sms_settings").upsert(patch, { onConflict: "user_id" });
  revalidatePath("/settings");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
