import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/login", "/forgot", "/auth", "/api/sms", "/api/visit", "/privacy", "/terms"];
const VISITOR_COOKIE = "kudi_vid";

// Refreshes the Supabase session on every request, keeps signed-out visitors
// on the login page, and gives each browser an anonymous visitor ID.
export async function proxy(request: NextRequest) {
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

  // Checks the session token's signature locally (fast). It also refreshes an
  // expired session, which is why it must run on every request.
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims?.sub ? { id: claimsData.claims.sub } : null;

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC.some((p) => path === p || path.startsWith(p + "/") || path.startsWith(p + "?"));

  let visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const newVisitor = !visitorId || !/^[a-f0-9-]{36}$/.test(visitorId);
  if (newVisitor) visitorId = crypto.randomUUID();

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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
