"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/auth-actions";
import Footer from "@/components/Footer";

const initial: AuthState = { ok: false, message: "", stamp: 0 };

const NOTICES: Record<string, string> = {
  "link-expired": "That email link has expired or was already used. Sign in, or ask for a new reset link.",
};

export default function LoginScreen({ notice }: { notice?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [show, setShow] = useState(false);
  const [inState, inAction, inPending] = useActionState(signIn, initial);
  const [upState, upAction, upPending] = useActionState(signUp, initial);
  const state = mode === "signin" ? inState : upState;
  const pending = inPending || upPending;
  const banner = notice ? NOTICES[notice] : "";

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="grid flex-1 lg:grid-cols-[1.1fr_1fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-brown p-12 text-cream lg:flex">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red text-xl font-bold text-white">₵</span>
            <span className="text-lg font-bold">Kudi Tracker</span>
          </div>
          <div className="rise">
            <p className="display max-w-lg text-6xl font-bold leading-[0.95]">Every cedi, accounted for.</p>
            <p className="mt-6 max-w-md text-lg text-cream/75">MoMo payments record themselves from your SMS. Cash takes two taps.</p>
          </div>
          <a href="https://paatech.vercel.app" target="_blank" rel="noopener noreferrer" className="text-sm text-cream/50 hover:text-cream hover:underline">
            by Paa Asane Technologies
          </a>
        </section>

        <section className="flex flex-col justify-center px-5 py-10 sm:px-12">
          <div className="w-full max-w-sm">
            <div className="rise mb-8 lg:hidden">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red text-2xl font-bold text-white">₵</span>
              <p className="display mt-6 text-[40px] font-bold leading-none">Every cedi, accounted for.</p>
              <p className="mt-3 text-[15px] text-muted">MoMo payments record themselves. Cash takes two taps.</p>
            </div>

            <div className="rise" style={{ ["--i" as string]: 1 }}>
              <h1 className="text-2xl font-bold">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
              <p className="mt-1 text-[15px] text-muted">
                {mode === "signin" ? "First time here? " : "Already have an account? "}
                <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-red hover:underline">
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </div>

            {banner && <p className="mt-5 rounded-xl border-l-[3px] border-orange bg-cream px-3.5 py-2.5 text-sm">{banner}</p>}

            <form key={mode} action={mode === "signin" ? inAction : upAction} className="rise mt-6 space-y-4" style={{ ["--i" as string]: 2 }}>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Email</span>
                <input className="field" name="email" type="email" required autoComplete="email" inputMode="email" />
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-baseline justify-between text-sm font-medium">
                  Password
                  {mode === "signin" && (
                    <Link href="/forgot" className="font-medium text-red hover:underline">
                      Forgot password?
                    </Link>
                  )}
                </span>
                <span className="relative block">
                  <input
                    className="field pr-12"
                    name="password"
                    type={show ? "text" : "password"}
                    required
                    minLength={mode === "signup" ? 8 : undefined}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted hover:text-ink"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
                {mode === "signup" && <span className="mt-1.5 block text-[13px] text-muted">At least 8 characters. Don&apos;t reuse a password from another site.</span>}
              </label>

              {state.message && (
                <p
                  key={state.stamp}
                  className={`fade-in rounded-xl px-3.5 py-2.5 text-sm ${state.ok ? "bg-green/10 text-green" : "bg-red/10 text-red-dark"}`}
                  role="alert"
                >
                  {state.message}
                </p>
              )}

              <button className="btn w-full" disabled={pending}>
                {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer signedIn={false} />
    </div>
  );
}
