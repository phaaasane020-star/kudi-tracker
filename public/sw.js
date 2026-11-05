// Kudi Tracker offline support.
// Every page is saved on the phone while online, so Kudi opens without data.
// Records added, changed or deleted offline wait on the phone and upload later.
// Sign-in and MoMo Sync always need the internet.

const STATIC = "kudi-static-v3";
const PAGES = "kudi-pages";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((c) => c.addAll(["/offline.html", "/icon.svg", "/apple-icon.png", "/google-g.png"]).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("kudi-static-") && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  // Sent on the sign-in page: forget saved pages so the next person can't see them.
  if (event.data === "clear-pages") event.waitUntil(caches.delete(PAGES));
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // App code, fonts and images: these never change once built, so use the saved copy.
  if (url.pathname.startsWith("/_next/static/") || /\.(?:woff2?|png|svg|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(STATIC).then(async (c) => {
        const hit = await c.match(req, { ignoreVary: true });
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // Pages and page data: get the latest when online, fall back to the saved copy when offline.
  event.respondWith(
    (async () => {
      const c = await caches.open(PAGES);
      try {
        const res = await fetch(req);
        const landedOn = new URL(res.url || req.url).pathname;
        if (res.ok && !res.redirected && landedOn !== "/login") c.put(req, res.clone());
        return res;
      } catch {
        const exact = await c.match(req, { ignoreVary: true });
        const isPage = (r) => (r.headers.get("content-type") || "").includes("text/html");
        if (exact && (req.mode !== "navigate" || isPage(exact))) return exact;
        if (req.mode === "navigate") {
          // Same page with a different book or month: show the saved copy.
          const saved = await c.matchAll(req, { ignoreSearch: true, ignoreVary: true });
          const page = saved.find((r) => (r.headers.get("content-type") || "").includes("text/html"));
          return page || (await caches.match("/offline.html")) || Response.error();
        }
        // Background page data the phone doesn't have: fail, so the app opens the saved page instead.
        return Response.error();
      }
    })()
  );
});
