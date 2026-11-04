import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const PUBLIC = ["/login", "/forgot", "/auth", "/api/sms"];
const VISITOR_COOKIE = "kudi_vid";

// Refreshes the Supabase session on every request, keeps signed-out visitors
// on the login page, and records page visits for the Security page.
export async function proxy(request: NextRequest, event: NextFetchEvent) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC.some((p) => path === p || path.startsWith(p + "/") || path.startsWith(p + "?"));

  let visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const newVisitor = !visitorId || !/^[a-f0-9-]{36}$/.test(visitorId);
  if (newVisitor) visitorId = crypto.randomUUID();

  // Count real page loads only (not background data requests or prefetches).
  const isPageLoad =
    request.method === "GET" &&
    request.headers.get("sec-fetch-dest") === "document" &&
    !request.headers.get("next-router-prefetch") &&
    !path.startsWith("/api") &&
    !path.startsWith("/auth");
  if (isPageLoad) event.waitUntil(logVisit(request, path, visitorId!, user?.id ?? null));

  let result: NextResponse = response;
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    result = redirectKeepingCookies(url, response);
  } else if (user && (path === "/login" || path === "/forgot")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    result = redirectKeepingCookies(url, response);
  }

  if (newVisitor) {
    result.cookies.set(VISITOR_COOKIE, visitorId!, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return result;
}

function redirectKeepingCookies(url: URL, from: NextResponse) {
  const r = NextResponse.redirect(url);
  from.cookies.getAll().forEach((c) => r.cookies.set(c));
  return r;
}

async function logVisit(request: NextRequest, path: string, visitorId: string, userId: string | null) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return;
  const h = request.headers;
  let city = h.get("x-vercel-ip-city");
  try {
    city = city ? decodeURIComponent(city) : null;
  } catch {
    /* keep raw */
  }
  try {
    await fetch(`${base}/rest/v1/security_events`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        kind: "visit",
        path: path.slice(0, 200),
        visitor_id: visitorId,
        user_id: userId,
        ip: (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null,
        country: h.get("x-vercel-ip-country"),
        city,
        user_agent: h.get("user-agent")?.slice(0, 300) ?? null,
      }),
    });
  } catch {
    // A failed log must never break the page.
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
