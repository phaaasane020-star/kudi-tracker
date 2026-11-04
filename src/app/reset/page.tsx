import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import { ResetForm } from "@/components/PasswordForms";
import { createClient } from "@/lib/supabase/server";

// Reached from the reset email (via /auth/callback) or from "Change password".
export default async function ResetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?notice=link-expired");

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col justify-center px-5 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <ResetForm email={user.email ?? "your account"} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
