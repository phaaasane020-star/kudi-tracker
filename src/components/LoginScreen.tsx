"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signInWithGoogle, signUp, type AuthState } from "@/app/auth-actions";
import PasswordMeter from "@/components/PasswordMeter";
import { isStrongPassword } from "@/lib/password";
import AuthShell from "@/components/AuthShell";

const initial: AuthState = { ok: false, message: "", stamp: 0 };

const NOTICES: Record<string, string> = {
  "link-expired": "That email link has expired or was already used. Sign in, or ask for a new reset link.",
  "google-off": "Google sign-in isn't switched on for this app yet. Use your email and password for now.",
};

export default function LoginScreen({ notice }: { notice?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inState, inAction, inPending] = useActionState(signIn, initial);
  const [upState, upAction, upPending] = useActionState(signUp, initial);
  const state = mode === "signin" ? inState : upState;
  const pending = inPending || upPending;
  const banner = notice ? NOTICES[notice] : "";

  return (
    <AuthShell heading="Every cedi, accounted for." text="MoMo payments record themselves from your SMS. Cash takes two taps.">
            <div className="rise mb-8 md:hidden">
              <p className="display text-[clamp(2rem,9vw,2.5rem)] font-bold leading-none">Every cedi, accounted for.</p>
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
                <input
                  className="field"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
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
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {mode === "signup" && <PasswordMeter password={password} email={email} />}
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

              <button className="btn w-full" disabled={pending || (mode === "signup" && !isStrongPassword(password, email))}>
                {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="rise my-6 flex items-center gap-3 text-[13px] text-muted" style={{ ["--i" as string]: 3 }}>
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
            <form action={signInWithGoogle} className="rise" style={{ ["--i" as string]: 3 }}>
              <GoogleButton />
            </form>
            {mode === "signup" && (
              <p className="mt-4 text-[13px] leading-relaxed text-muted">
                New accounts have to be approved by the owner of this Kudi Tracker before they can be used.
              </p>
            )}
    </AuthShell>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-soft w-full py-3 text-[15px]" disabled={pending}>
      {pending ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}
