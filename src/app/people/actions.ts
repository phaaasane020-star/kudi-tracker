"use server";

import { revalidatePath } from "next/cache";
import { getAccess } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/security";

/** Owner only: approve, decline or remove someone. The database rules enforce this too. */
export async function decideMember(fd: FormData) {
  const access = await getAccess();
  if (!access.isOwner) return;
  const userId = String(fd.get("user_id") ?? "");
  const decision = String(fd.get("decision") ?? "");
  if (!userId || !["approved", "declined"].includes(decision)) return;

  const supabase = await createClient();
  const { data: before } = await supabase.from("members").select("email,status").eq("user_id", userId).maybeSingle();
  const { error } = await supabase
    .from("members")
    .update({ status: decision, decided_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (!error) {
    const kind = decision === "approved" ? "member_approved" : before?.status === "approved" ? "member_removed" : "member_declined";
    await logEvent(kind, { email: before?.email ?? null, user_id: userId });
  }
  revalidatePath("/people");
}
