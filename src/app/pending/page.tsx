import { Clock, LogOut, RefreshCw, ShieldX } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import AuthShell from "@/components/AuthShell";
import { getAccess } from "@/lib/access";
import { verifiedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Where new accounts wait until the owner approves them.
export default async function PendingPage() {
  const supabase = await createClient();
  const user = await verifiedUser(supabase);
  if (!user) redirect("/login");
  const access = await getAccess();
  if (access.status === "approved") redirect("/");

  const declined = access.status === "declined";
  return (
    <AuthShell signedIn heading="Kudi is invite-only." text="Every new account is checked by the owner before it can see or record anything.">
      <div className="rise">
        <span className={`pop flex h-14 w-14 items-center justify-center rounded-2xl ${declined ? "bg-red/10 text-red" : "bg-cream text-orange"}`}>
          {declined ? <ShieldX size={28} /> : <Clock size={28} />}
        </span>
        <h1 className="mt-5 text-2xl font-bold">{declined ? "Access wasn't approved" : "Waiting for approval"}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {declined
            ? `The owner of this Kudi Tracker didn't approve ${user.email ?? "this account"}. If you think that's a mistake, contact them directly.`
            : `Your account (${user.email ?? "this account"}) is set up. The owner has been asked to approve it, and you can start as soon as they do.`}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {!declined && (
            <Link href="/pending" prefetch={false} className="btn">
              <RefreshCw size={16} /> Check again
            </Link>
          )}
          <form action={signOut}>
            <button className="btn-soft w-full">
              <LogOut size={16} /> Sign out
            </button>
          </form>
        </div>
      </div>
    </AuthShell>
  );
}
