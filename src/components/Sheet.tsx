"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Pop-up over a blurred page. On phones it rises from the bottom and follows the
 * visible screen, so the iPhone keyboard never covers the buttons. Centred on larger screens.
 */
export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);

    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    panel.current?.focus({ preventScroll: true });

    // Track the part of the screen not hidden by the keyboard.
    const vv = window.visualViewport;
    const update = () => vv && setView({ top: vv.offsetTop, height: vv.height });
    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);

    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = overflow;
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex h-dvh items-end justify-center sm:items-center sm:p-6"
      style={view ? { top: view.top, height: view.height } : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button aria-label="Close" tabIndex={-1} onClick={onClose} className="fade-in absolute inset-0 bg-brown/35 backdrop-blur-sm" />
      <div
        ref={panel}
        tabIndex={-1}
        className="sheet-in relative flex max-h-[calc(100%-12px)] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl outline-none sm:max-h-[88%] sm:max-w-md sm:rounded-[24px]"
      >
        <div className="relative flex shrink-0 items-center justify-between border-b border-line/60 px-5 pb-3 pt-5">
          <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-line sm:hidden" />
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="press -mr-2 rounded-full p-2 text-muted hover:bg-wash" aria-label="Close">
            <X size={22} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-5 pt-4">{children}</div>
      </div>
    </div>
  );
}
