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
  | "sms_bad_token";

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

export async function logEvent(kind: SecurityKind, extra: { email?: string | null; user_id?: string | null; path?: string } = {}) {
  const db = adminClient();
  if (!db) return;
  const info = await clientInfo();
  await db.from("security_events").insert({
    kind,
    email: extra.email?.toLowerCase().slice(0, 200) ?? null,
    user_id: extra.user_id ?? null,
    path: extra.path ?? null,
    ...info,
  });
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
  const filters = [`email.eq.${email.toLowerCase().replace(/[,()]/g, "")}`];
  if (ip) filters.push(`ip.eq.${ip.replace(/[,()]/g, "")}`);
  const { count } = await db
    .from("security_events")
    .select("id", { count: "exact", head: true })
    .in("kind", kinds)
    .gte("created_at", since)
    .or(filters.join(","));
  return (count ?? 0) >= max;
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
