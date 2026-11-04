"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAccess } from "@/lib/access";
import { verifiedUser } from "@/lib/auth";
import { monthRange } from "@/lib/format";
import { adminClient, logEvent } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

// Everything here deletes only the signed-in person's own data.
// The database rules enforce that as well, so a tampered request can't reach anyone else's.

async function me() {
  const supabase = await createClient();
  const user = await verifiedUser(supabase);
  if (!user) redirect("/login");
  return { supabase, user };
}
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const done = () => revalidatePath("/", "layout");

/** A category goes; its records stay, just without a category. */
export async function deleteCategory(fd: FormData) {
  const { supabase } = await me();
  const id = str(fd, "id");
  if (id) await supabase.from("categories").delete().eq("id", id);
  done();
}

export async function deleteInboxItem(fd: FormData) {
  const { supabase, user } = await me();
  const id = str(fd, "id");
  if (id) await supabase.from("sms_inbox").delete().eq("id", id).eq("user_id", user.id);
  done();
}

export async function clearInbox() {
  const { supabase, user } = await me();
  await supabase.from("sms_inbox").delete().eq("user_id", user.id);
  done();
}

/** scope: "month" (one month of one book), "book" (all of one book) or "all" (both books). */
export async function deleteRecords(fd: FormData) {
  const { supabase, user } = await me();
  const scope = str(fd, "scope");
  const bookId = str(fd, "book_id");
  const month = str(fd, "month");

  if (scope === "month" && bookId && /^\d{4}-\d{2}$/.test(month)) {
    const { start, end } = monthRange(month);
    await supabase.from("transactions").delete().eq("book_id", bookId).gte("occurred_on", start).lt("occurred_on", end);
  } else if (scope === "book" && bookId) {
    await supabase.from("transactions").delete().eq("book_id", bookId);
  } else if (scope === "all") {
    await supabase.from("transactions").delete().eq("user_id", user.id);
    await supabase.from("sms_inbox").delete().eq("user_id", user.id);
  }
  done();
  redirect(`/account?deleted=${scope}`);
}

/** Removes the account and every record, category, budget and MoMo link with it. Not for the owner. */
export async function deleteAccount(fd: FormData) {
  const { user } = await me();
  if (str(fd, "confirm").toUpperCase() !== "DELETE") redirect("/account?error=type-delete");

  const access = await getAccess();
  if (access.isOwner) redirect("/account?error=owner");

  const admin = adminClient();
  if (!admin) redirect("/account?error=server");

  // Books, categories, records, MoMo settings and messages are removed with the account.
  await logEvent("member_removed", { email: user.email, user_id: user.id, path: "/account" });
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) redirect("/account?error=server");

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?notice=account-deleted");
}
