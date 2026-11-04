import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient, readClient } from "@/lib/security";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|curl|wget|python|node-fetch|headless/i;

/** The app pings this on every page you open, including taps inside the app. */
export async function POST(request: NextRequest) {
  const db = adminClient();
  if (!db) return NextResponse.json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 503 });

  const ua = request.headers.get("user-agent") ?? "";
  if (BOT.test(ua)) return NextResponse.json({ ok: true, skipped: "bot" });

  let path = "/";
  try {
    const body = JSON.parse((await request.text()) || "{}");
    if (typeof body.path === "string" && body.path.startsWith("/")) path = body.path.slice(0, 200);
  } catch {
    /* keep "/" */
  }

  let visitorId = request.cookies.get("kudi_vid")?.value ?? null;
  if (!visitorId || !/^[a-f0-9-]{36}$/.test(visitorId)) visitorId = crypto.randomUUID();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const { error } = await db.from("security_events").insert({
    kind: "visit",
    path,
    visitor_id: visitorId,
    user_id: data?.claims?.sub ?? null,
    ...readClient(request.headers),
  });

  const res = NextResponse.json({ ok: !error, error: error?.message });
  res.cookies.set("kudi_vid", visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
