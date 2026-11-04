import Footer from "@/components/Footer";
import { ForgotForm } from "@/components/PasswordForms";

export default function ForgotPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col justify-center px-5 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <ForgotForm />
        </div>
      </main>
      <Footer signedIn={false} />
    </div>
  );
}
