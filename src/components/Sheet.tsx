"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/** Pop-up over a blurred page. Slides up from the bottom on phones, centred on larger screens. */
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="fade-in absolute inset-0 bg-brown/35 backdrop-blur-md"
      />
      <div
        ref={panel}
        tabIndex={-1}
        className="sheet-in safe-bottom relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-white shadow-2xl outline-none sm:max-w-md sm:rounded-[28px]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white/95 px-5 pb-2 pt-3 backdrop-blur">
          <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-line sm:hidden" />
          <h2 className="pt-3 text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="mt-2 rounded-full p-2 text-muted hover:bg-wash" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}
