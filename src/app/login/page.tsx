"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else {
        router.replace("/");
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else if (data.session) {
        router.replace("/");
        router.refresh();
      } else {
        setNotice("Account created. Open the email from Supabase and tap the link to confirm, then sign in.");
        setMode("signin");
      }
    }
    setBusy(false);
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-brown p-12 text-cream lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red text-xl font-bold text-white">₵</span>
          <span className="text-lg font-bold">Kudi Tracker</span>
        </div>
        <div>
          <p className="display max-w-lg text-6xl font-bold leading-[0.95]">Every cedi, accounted for.</p>
          <p className="mt-6 max-w-md text-lg text-cream/75">
            MoMo payments record themselves from your SMS. Cash takes two taps.
          </p>
        </div>
        <p className="text-sm text-cream/50">by Paa Asane Technologies</p>
      </section>

      <section className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red text-2xl font-bold text-white">₵</span>
            <p className="display mt-6 text-[40px] font-bold leading-none">Every cedi, accounted for.</p>
            <p className="mt-3 text-[15px] text-muted">MoMo payments record themselves. Cash takes two taps.</p>
          </div>

          <h1 className="text-2xl font-bold">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
          <p className="mt-1 text-[15px] text-muted">
            {mode === "signin" ? "New here? " : "Already have an account? "}
            <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-red hover:underline">
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Email</span>
              <input className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Password</span>
              <input
                className="field"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && <p className="rounded-xl bg-red/10 px-3.5 py-2.5 text-sm text-red-dark">{error}</p>}
            {notice && <p className="rounded-xl bg-green/10 px-3.5 py-2.5 text-sm text-green">{notice}</p>}

            <button className="btn w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
