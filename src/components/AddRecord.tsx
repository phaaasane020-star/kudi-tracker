"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import RecordForm from "@/components/RecordForm";
import Sheet from "@/components/Sheet";
import type { Category } from "@/lib/types";

const EVENT = "kudi:add-record";

/** Any button on the page can open the add pop-up by firing this event. */
export function AddButton({ variant }: { variant: "fab" | "sidebar" | "inline" }) {
  const open = () => window.dispatchEvent(new Event(EVENT));
  if (variant === "fab") {
    return (
      <button
        onClick={open}
        aria-label="Add a record"
        className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-red text-white shadow-lg shadow-red/30 ring-4 ring-white transition active:scale-95"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>
    );
  }
  if (variant === "sidebar") {
    return (
      <button onClick={open} className="btn w-full">
        <Plus size={18} strokeWidth={2.5} /> Add a record
      </button>
    );
  }
  return (
    <button onClick={open} className="btn-soft">
      <Plus size={16} /> Add cash spending
    </button>
  );
}

export default function AddRecordSheet({ bookId, categories }: { bookId: string; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    const onOpen = () => {
      setKey((k) => k + 1);
      setOpen(true);
    };
    window.addEventListener(EVENT, onOpen);
    return () => window.removeEventListener(EVENT, onOpen);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const done = useCallback(() => {
    setOpen(false);
    setSaved("Saved");
    setTimeout(() => setSaved(""), 2200);
  }, []);

  return (
    <>
      <Sheet open={open} onClose={close} title="Add a record">
        <RecordForm key={key} bookId={bookId} categories={categories} onDone={done} />
      </Sheet>
      {saved && (
        <div className="fade-in fixed inset-x-0 bottom-24 z-50 flex justify-center lg:bottom-8" role="status">
          <span className="rounded-full bg-brown px-4 py-2 text-sm font-medium text-cream shadow-lg">{saved}</span>
        </div>
      )}
    </>
  );
}
