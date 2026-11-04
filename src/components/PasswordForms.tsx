"use client";

import { ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { requestPasswordReset, setNewPassword, type AuthState } from "@/app/auth-actions";

const initial: AuthState = { ok: false, message: "", stamp: 0 };

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);

  if (state.ok) {
    return (
      <div className="rise">
        <span className="pop flex h-14 w-14 items-center justify-center rounded-2xl bg-green/10 text-green">
          <MailCheck size={28} />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{state.message}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">The link works once and expires after an hour.</p>
        <Link href="/login" className="btn-soft mt-6">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rise">
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} /> Sign in
      </Link>
      <h1 className="text-2xl font-bold">Forgot your password?</h1>
      <p className="mt-1.5 text-[15px] text-muted">Enter the email you signed up with and we&apos;ll send you a link to choose a new password.</p>
      <form action={action} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input className="field" name="email" type="email" required autoComplete="email" inputMode="email" autoFocus />
        </label>
        {state.message && <p className="fade-in rounded-xl bg-red/10 px-3.5 py-2.5 text-sm text-red-dark">{state.message}</p>}
        <button className="btn w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </div>
  );
}

export function ResetForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(setNewPassword, initial);
  const [show, setShow] = useState(false);
  return (
    <div className="rise">
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <p className="mt-1.5 text-[15px] text-muted">For {email}. Other devices signed in to your account will be signed out.</p>
      <form action={action} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">New password</span>
          <span className="relative block">
            <input className="field pr-12" name="password" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" autoFocus />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted hover:text-ink"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          <span className="mt-1.5 block text-[13px] text-muted">At least 8 characters.</span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Type it again</span>
          <input className="field" name="confirm" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" />
        </label>
        {state.message && <p className="fade-in rounded-xl bg-red/10 px-3.5 py-2.5 text-sm text-red-dark">{state.message}</p>}
        <button className="btn w-full" disabled={pending}>
          {pending ? "Saving…" : "Save new password"}
        </button>
      </form>
    </div>
  );
}
