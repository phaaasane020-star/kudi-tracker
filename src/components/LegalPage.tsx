import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { verifiedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const LEGAL_UPDATED = "4 November 2026";
export const LEGAL_CONTACT = "ayesuappiahjoseph@gmail.com";

/** Shared layout for the Privacy Policy and Terms of Use. Readable by anyone, signed in or not. */
export default async function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await verifiedUser(supabase);
  const back = user ? "/" : "/login";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href={back} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red text-lg font-bold text-white">₵</span>
            <span className="text-[17px] font-bold">Kudi Tracker</span>
          </Link>
          <Link href={back} className="press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted hover:bg-wash hover:text-ink">
            <ArrowLeft size={16} /> {user ? "Back to Kudi" : "Sign in"}
          </Link>
        </div>
      </header>

      <main className="page-enter mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
        <h1 className="display text-[clamp(2rem,6vw,3rem)] leading-[1.05]">{title}</h1>
        <p className="mt-3 text-sm text-muted">Last updated {LEGAL_UPDATED}</p>
        <p className="mt-6 max-w-[65ch] text-[17px] leading-relaxed">{intro}</p>
        <div className="legal mt-10 max-w-[68ch]">{children}</div>
      </main>

      <Footer signedIn={!!user} />
    </div>
  );
}
