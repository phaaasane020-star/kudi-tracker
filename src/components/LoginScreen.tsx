"use client";

import { Eye, EyeOff, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signInWithGoogle, signUp, type AuthState } from "@/app/auth-actions";
import PasswordMeter from "@/components/PasswordMeter";
import { isStrongPassword } from "@/lib/password";
import AuthShell from "@/components/AuthShell";
import HowItWorks from "@/components/HowItWorks";
import { ForgetSavedPages } from "@/components/Offline";

const initial: AuthState = { ok: false, message: "", stamp: 0 };

const NOTICES: Record<string, string> = {
  "link-expired": "That email link has expired or was already used. Sign in, or ask for a new reset link.",
  "account-deleted": "Your account and everything in it has been deleted.",
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
  const [banner, setBanner] = useState(notice ? NOTICES[notice] ?? "" : "");

  // Show a notice once, then take it out of the address bar so a refresh doesn't bring it back.
  useEffect(() => {
    if (!notice) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("notice");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [notice]);

  return (
    <AuthShell heading="Every cedi, accounted for." text="Your MoMo payments record themselves from the SMS you already get." aside={<HowItWorks variant="panel" />}>
      <ForgetSavedPages />
            <div className="rise mb-6 md:hidden">
              <p className="display text-[clamp(1.6rem,7.5vw,2.1rem)] font-bold leading-[1.05]">Every cedi, accounted for.</p>
              <div className="mt-4">
                <HowItWorks variant="strip" />
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(63,41,43,0.04),0_12px_32px_-16px_rgba(63,41,43,0.18)] sm:p-7">
            <div className="rise" style={{ ["--i" as string]: 1 }}>
              <h1 className="text-2xl font-bold">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
              <p className="mt-1 text-[15px] text-muted">
                {mode === "signin" ? "First time here? " : "Already have an account? "}
                <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-red hover:underline">
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </div>

            {banner && (
              <div className="fade-in mt-5 flex items-start gap-2 rounded-xl border-l-[3px] border-orange bg-cream py-2.5 pl-3.5 pr-2 text-sm" role="status">
                <p className="flex-1">{banner}</p>
                <button type="button" onClick={() => setBanner("")} className="press -my-1 rounded-lg p-1.5 text-muted hover:text-ink" aria-label="Close message">
                  <X size={16} />
                </button>
              </div>
            )}

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
                New accounts have to be approved by the owner of this Kudi Tracker before they can be used. By continuing, you agree to the 
                <Link href="/terms" className="font-semibold text-red hover:underline">
                  Terms of Use
                </Link> 
                and 
                <Link href="/privacy" className="font-semibold text-red hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            )}
            </div>
    </AuthShell>
  );
}

/**
 * Styled to Google's sign-in button guidelines (light theme): white, grey outline, dark grey text.
 * Google's official "G" mark appears once you add their file to public/google-g.png
 * (download it from Google's "Sign in with Google" branding guidelines page).
 */
function GoogleButton() {
  const { pending } = useFormStatus();
  const [logo, setLogo] = useState(true);
  return (
    <button
      className="press relative flex w-full items-center justify-center gap-3 rounded-full border border-[#747775] bg-white px-4 py-3 text-[15px] font-medium text-[#1F1F1F] transition-colors hover:bg-[#F8FAFF] disabled:opacity-60"
      disabled={pending}
    >
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/google-g.png" alt="" width={20} height={20} className="h-5 w-5" onError={() => setLogo(false)} />
      )}
      {pending ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}
