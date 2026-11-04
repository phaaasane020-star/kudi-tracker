import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
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
    <AuthShell signedIn heading="A fresh password." text="Pick one you don't use anywhere else. Every other device signed in to your account will be signed out.">
      <ResetForm email={user.email ?? "your account"} />
    </AuthShell>
  );
}
