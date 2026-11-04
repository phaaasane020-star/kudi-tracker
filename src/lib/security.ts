import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

export type SecurityKind =
  | "visit"
  | "signin_success"
  | "signin_failed"
  | "signin_blocked"
  | "signup"
  | "password_reset_requested"
  | "password_changed"
  | "signout_all"
  | "sms_bad_token"
  | "member_approved"
  | "member_declined"
  | "member_removed"
  | "google_signin"
  | "logging_test";

let admin: SupabaseClient | null = null;

/** Service client: only ever used on the server, never sent to the browser. */
export function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  admin ??= createClient(url, key, { auth: { persistSession: false } });
  return admin;
}

export function readClient(h: Headers) {
  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "").split(",")[0].trim() || null;
  const decode = (v: string | null) => {
    if (!v) return null;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  return {
    ip,
    country: h.get("x-vercel-ip-country"),
    city: decode(h.get("x-vercel-ip-city")),
    user_agent: h.get("user-agent")?.slice(0, 300) ?? null,
  };
}

export async function clientInfo() {
  return readClient(await headers());
}

export async function logEvent(
  kind: SecurityKind,
  extra: { email?: string | null; user_id?: string | null; path?: string } = {}
): Promise<string | null> {
  const db = adminClient();
  if (!db) {
    console.error("[security] SUPABASE_SERVICE_ROLE_KEY is not set, so events can't be saved");
    return "SUPABASE_SERVICE_ROLE_KEY is not set";
  }
  const info = await clientInfo();
  const { error } = await db.from("security_events").insert({
    kind,
    email: extra.email?.toLowerCase().slice(0, 200) ?? null,
    user_id: extra.user_id ?? null,
    path: extra.path ?? null,
    ...info,
  });
  if (error) console.error(`[security] could not save "${kind}":`, error.message);
  return error?.message ?? null;
}

/** For the Security page: can the server actually save events? Explains the problem in plain words. */
export async function loggingHealth(): Promise<{ ok: boolean; problem: string | null; keyKind: string }> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const keyKind = !key ? "missing" : key.startsWith("sb_secret_") ? "secret key" : key.startsWith("eyJ") ? "service_role key" : "unknown";
  if (!key) {
    return { ok: false, keyKind, problem: "SUPABASE_SERVICE_ROLE_KEY isn't set on the server. Add it in Vercel → Settings → Environment Variables, then redeploy." };
  }
  if (key.startsWith("sb_publishable_") || key === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { ok: false, keyKind: "public key", problem: "SUPABASE_SERVICE_ROLE_KEY holds the public (anon/publishable) key. Use the secret service_role key instead." };
  }
  const err = await logEvent("logging_test", { path: "/security" });
  if (!err) {
    await adminClient()?.from("security_events").delete().eq("kind", "logging_test");
    return { ok: true, keyKind, problem: null };
  }
  if (/relation .*security_events.* does not exist|could not find the table/i.test(err)) {
    return { ok: false, keyKind, problem: "The security_events table doesn't exist yet. Run the latest schema.sql in Supabase → SQL Editor." };
  }
  if (/check constraint/i.test(err)) {
    return { ok: false, keyKind, problem: "The database is an older version. Run the latest schema.sql in Supabase → SQL Editor." };
  }
  if (/invalid api key|jwt|unauthorized|401/i.test(err)) {
    return { ok: false, keyKind, problem: "Supabase rejected SUPABASE_SERVICE_ROLE_KEY. Copy it again from Supabase → Project Settings → API keys, update it in Vercel, then redeploy." };
  }
  return { ok: false, keyKind, problem: `Supabase said: ${err}` };
}

/**
 * True when this device or this email has failed too often recently.
 * Default: 5 failed sign-ins in 15 minutes locks sign-in for that window.
 */
export async function isLockedOut(email: string, kinds: SecurityKind[] = ["signin_failed"], max = 5, minutes = 15) {
  const db = adminClient();
  if (!db) return false;
  const { ip } = await clientInfo();
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  const count = async (column: "email" | "ip", value: string) => {
    const { count } = await db
      .from("security_events")
      .select("id", { count: "exact", head: true })
      .in("kind", kinds)
      .gte("created_at", since)
      .eq(column, value);
    return count ?? 0;
  };
  const [byEmail, byDevice] = await Promise.all([count("email", email.toLowerCase()), ip ? count("ip", ip) : Promise.resolve(0)]);
  return byEmail >= max || byDevice >= max;
}

export async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Turns a user agent into something readable: "iPhone, Safari". */
export function deviceLabel(ua: string | null): string {
  if (!ua) return "Unknown device";
  const device = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux"
              : "Unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /CriOS|Chrome\//.test(ua)
      ? "Chrome"
      : /FxiOS|Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : /bot|crawl|spider|curl|python|node/i.test(ua)
            ? "Bot or script"
            : "";
  return browser ? `${device}, ${browser}` : device;
}
