"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { flushOutbox, OUTBOX_EVENT, readOutbox } from "@/lib/outbox";

/** Turns on offline support (once per app load). */
export function OfflineSupport() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const ok = location.protocol === "https:" || location.hostname === "localhost";
    if (ok) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  // Offline, a tap on a link opens the saved copy of that page directly
  // (the app's usual background page fetch can't work without internet).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navigator.onLine || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.href === location.href) return;
      e.preventDefault();
      e.stopPropagation();
      location.assign(url.href);
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, []);
  return null;
}

/** On the sign-in page: forget saved pages so whoever uses the phone next can't open them offline. */
export function ForgetSavedPages() {
  useEffect(() => {
    navigator.serviceWorker?.controller?.postMessage("clear-pages");
    caches?.delete("kudi-pages").catch(() => {});
  }, []);
  return null;
}

/** Thin bar under the header: shows when you're offline and how many records are waiting to upload. */
export function OfflineBar() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [waiting, setWaiting] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const count = () => setWaiting(readOutbox().length);
    const sync = async () => {
      if (!navigator.onLine || readOutbox().length === 0) return;
      setSyncing(true);
      const sent = await flushOutbox();
      setSyncing(false);
      count();
      if (sent > 0) router.refresh();
    };
    const goOnline = () => {
      setOnline(true);
      sync();
    };
    const goOffline = () => setOnline(false);

    setOnline(navigator.onLine);
    count();
    sync();
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener(OUTBOX_EVENT, count);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener(OUTBOX_EVENT, count);
    };
  }, [router]);

  if (online && waiting === 0) return null;

  return (
    <div className={`fade-in flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-medium ${online ? "bg-cream text-ink" : "bg-brown text-cream"}`} role="status">
      {online ? <RefreshCw size={14} className={syncing ? "animate-spin" : ""} /> : <CloudOff size={14} />}
      {online
        ? `Uploading ${waiting} record${waiting === 1 ? "" : "s"} saved offline…`
        : waiting > 0
          ? `You're offline. ${waiting} record${waiting === 1 ? "" : "s"} will upload when you're back online.`
          : "You're offline. Showing what you last opened."}
    </div>
  );
}

const SAVED_AT = "kudi-pages-saved-at";

/**
 * While online, quietly saves every page (and the code they need) on the phone,
 * so all of Kudi opens offline, not only pages you've visited.
 * Runs at most once every 10 minutes to save data.
 */
export function SaveAllPages({ owner }: { owner: boolean }) {
  useEffect(() => {
    if (!navigator.onLine || !("serviceWorker" in navigator)) return;
    try {
      const last = Number(sessionStorage.getItem(SAVED_AT) || 0);
      if (Date.now() - last < 10 * 60_000) return;
    } catch {
      /* ignore */
    }
    const run = async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) return; // first visit: the worker takes over on the next load
      const pages = ["/", "/transactions", "/categories", "/settings", "/account", "/guide", "/privacy", "/terms"];
      if (owner) pages.push("/people", "/security");
      const code = new Set<string>();
      for (const p of pages) {
        try {
          const html = await (await fetch(p, { credentials: "include" })).text();
          for (const m of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) code.add(m[0]);
        } catch {
          return; // went offline part-way
        }
      }
      await Promise.all([...code].map((u) => fetch(u).catch(() => null)));
      try {
        sessionStorage.setItem(SAVED_AT, String(Date.now()));
      } catch {
        /* ignore */
      }
    };
    const t = setTimeout(run, 3000); // after the page has settled
    return () => clearTimeout(t);
  }, [owner]);
  return null;
}
