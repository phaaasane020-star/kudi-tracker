import AuthShell from "@/components/AuthShell";
import { ForgotForm } from "@/components/PasswordForms";

export default function ForgotPage() {
  return (
    <AuthShell heading="Locked out? It happens." text="We'll email you a link to choose a new password. Your records stay exactly as they are.">
      <ForgotForm />
    </AuthShell>
  );
}
