"use client";

import { PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { TOUR_DONE } from "@/components/Tour";

/** Goes to Home and plays the guided tour again. */
export default function TourButton({ href = "/?tour=1", className = "btn" }: { href?: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        try {
          localStorage.removeItem(TOUR_DONE);
        } catch {
          /* ignore */
        }
        router.push(href);
      }}
      className={className}
    >
      <PlayCircle size={18} /> Watch the 1-minute tour
    </button>
  );
}
