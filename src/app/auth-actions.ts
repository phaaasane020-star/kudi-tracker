"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkSignupEmail } from "@/lib/email-check";
import { isStrongPassword } from "@/lib/password";
import { isLockedOut, logEvent, siteOrigin } from "@/lib/security";

export type AuthState = { ok: boolean; message: string; stamp: number };
const fail = (message: string): AuthState => ({ ok: false, message, stamp: Date.now() });
const done = (message: string): AuthState => ({ ok: true, message, stamp: Date.now() });

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 200;

export async function signIn(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!validEmail(email) || !password) return fail("Enter your email and password.");

  if (await isLockedOut(email)) {
    await logEvent("signin_blocked", { email });
    return fail("Too many wrong attempts. Sign-in is locked for 15 minutes. If you forgot your password, reset it below.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    await logEvent("signin_failed", { email });
    if (/confirm/i.test(error.message)) return fail("Confirm your email first. Open the link Supabase sent you.");
    return fail("That email and password don't match.");
  }

  await logEvent("signin_success", { email, user_id: data.user.id });
  redirect("/");
}

export async function signUp(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const emailProblem = await checkSignupEmail(email);
  if (emailProblem) return fail(emailProblem);
  if (!isStrongPassword(password, email)) return fail("Choose a stronger password. Tick every rule under the password box.");
  if (await isLockedOut(email, ["signup"], 3, 60)) return fail("Too many sign-up attempts. Try again in an hour.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback` },
  });
  await logEvent("signup", { email, user_id: data.user?.id });
  if (error) {
    if (/not allowed|disabled/i.test(error.message)) return fail("New accounts are turned off for this app.");
    return fail(error.message);
  }
  if (data.session) redirect("/");
  return done("Almost there. Open the email we sent and tap the link to confirm it's really you. Then the owner of this Kudi Tracker has to approve you before you can use it.");
}

export async function requestPasswordReset(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const email = str(fd, "email").toLowerCase();
  if (!validEmail(email)) return fail("Enter the email you signed up with.");
  if (await isLockedOut(email, ["password_reset_requested"], 3, 60)) {
    return fail("You've asked for several reset links already. Check your inbox and spam, or try again in an hour.");
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${await siteOrigin()}/auth/callback?next=/reset` });
  await logEvent("password_reset_requested", { email });
  // Same answer whether or not the account exists, so nobody can test emails here.
  return done("If that email has an account, a reset link is on its way. Check your inbox and spam folder.");
}

export async function setNewPassword(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (password !== confirm) return fail("The two passwords don't match.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Your reset link has expired. Ask for a new one.");
  if (!isStrongPassword(password, user.email ?? "")) return fail("Choose a stronger password. Tick every rule under the password box.");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail(/different|same/i.test(error.message) ? "Choose a password you haven't used here before." : error.message);

  await logEvent("password_changed", { email: user.email, user_id: user.id });
  // Sign every other device out, so an old session can't stay in.
  await supabase.auth.signOut({ scope: "others" });
  redirect("/?notice=password");
}

export async function signOutEverywhere() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await logEvent("signout_all", { email: user?.email, user_id: user?.id });
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}

/** "Continue with Google": sends you to Google, then back through /auth/callback. */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await siteOrigin()}/auth/callback?via=google`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) redirect("/login?notice=google-off");
  redirect(data.url);
}
