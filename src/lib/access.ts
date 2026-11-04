import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Access = {
  status: "pending" | "approved" | "declined";
  isOwner: boolean;
  pending: number;
  /** True when the approval part of schema.sql hasn't been run yet. */
  setupNeeded: boolean;
};

/** Your approval status, whether you're the owner, and how many people are waiting. One call per page. */
export const getAccess = cache(async (): Promise<Access> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_access");
  if (error) {
    // Database not updated yet: keep working as before instead of locking everyone out.
    if (error.code === "PGRST202" || error.code === "42883" || /my_access|schema cache|does not exist/i.test(error.message)) {
      return { status: "approved", isOwner: false, pending: 0, setupNeeded: true };
    }
    return { status: "pending", isOwner: false, pending: 0, setupNeeded: false };
  }
  const d = (data ?? {}) as { status?: Access["status"]; is_owner?: boolean; pending?: number };
  return { status: d.status ?? "pending", isOwner: !!d.is_owner, pending: Number(d.pending) || 0, setupNeeded: false };
});
