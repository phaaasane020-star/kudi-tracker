"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Tells the server which page was opened, so the Security page can count visits. */
export default function VisitTracker() {
  const path = usePathname();
  useEffect(() => {
    const body = JSON.stringify({ path });
    try {
      const sent = navigator.sendBeacon?.("/api/visit", new Blob([body], { type: "application/json" }));
      if (!sent) throw new Error("no beacon");
    } catch {
      fetch("/api/visit", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  }, [path]);
  return null;
}
