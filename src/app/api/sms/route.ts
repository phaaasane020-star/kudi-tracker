import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { recordSms } from "@/lib/record-sms";

/**
 * Your phone forwards each Mobile Money SMS here:
 *   POST https://your-app.vercel.app/api/sms?token=YOUR_SECRET
 *   body: {"from": "MobileMoney", "text": "Payment made for GHS 25.00 ..."}
 * Plain-text and form bodies work too, so most SMS forwarding apps can use it.
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? request.headers.get("x-kudi-token") ?? "";
  if (token.length < 32) return NextResponse.json({ ok: false, error: "Missing token" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "Server is missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: settings } = await admin
    .from("sms_settings")
    .select("user_id,book_id,enabled")
    .eq("token", token)
    .maybeSingle();
  if (!settings) return NextResponse.json({ ok: false, error: "Unknown token" }, { status: 401 });
  if (!settings.enabled) return NextResponse.json({ ok: true, status: "paused" });

  if (Number(request.headers.get("content-length") ?? 0) > 10_000) {
    return NextResponse.json({ ok: false, error: "Message too large" }, { status: 413 });
  }
  const { text, sender } = await readBody(request);
  if (!text) return NextResponse.json({ ok: false, error: "No message text" }, { status: 400 });

  let bookId = settings.book_id as string | null;
  if (bookId) {
    // The service key skips database rules, so check ownership here too.
    const { data: own } = await admin.from("books").select("id").eq("id", bookId).eq("user_id", settings.user_id).maybeSingle();
    if (!own) bookId = null;
  }
  if (!bookId) {
    const { data: book } = await admin
      .from("books")
      .select("id")
      .eq("user_id", settings.user_id)
      .eq("kind", "personal")
      .maybeSingle();
    bookId = book?.id ?? null;
  }
  if (!bookId) return NextResponse.json({ ok: false, error: "Open the app once to set up your books" }, { status: 409 });

  const outcome = await recordSms(admin, settings.user_id, bookId, text, sender);
  await admin.from("sms_settings").update({ last_received_at: new Date().toISOString() }).eq("user_id", settings.user_id);

  // Always 200 for a known token so the phone app doesn't keep retrying skipped messages.
  return NextResponse.json({ ok: true, ...outcome });
}

async function readBody(request: NextRequest): Promise<{ text: string; sender: string | null }> {
  const type = request.headers.get("content-type") ?? "";
  const raw = await request.text();
  let obj: Record<string, unknown> = {};

  if (type.includes("json") || raw.trim().startsWith("{")) {
    try {
      obj = JSON.parse(raw);
    } catch {
      obj = { text: raw };
    }
  } else if (type.includes("form-urlencoded")) {
    obj = Object.fromEntries(new URLSearchParams(raw));
  } else {
    obj = { text: raw };
  }

  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
  };

  return {
    text: (pick("text", "message", "body", "msg", "content", "sms") ?? "").slice(0, 2000),
    sender: pick("from", "sender", "address", "phone", "number"),
  };
}
