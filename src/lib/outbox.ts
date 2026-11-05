/**
 * Records added while offline wait here (on this phone only) until there's
 * internet again, then upload by themselves. Each one has its own ID, so a
 * record can never be uploaded twice.
 */
export type OutboxItem = {
  id: string;
  op?: "create" | "update" | "delete";
  record_id?: string;
  type: string;
  book_id: string;
  category_id: string;
  amount: string;
  occurred_on: string;
  payment_method: string;
  description: string;
  saved_at: number;
};

const KEY = "kudi-outbox-v1";
export const OUTBOX_EVENT = "kudi:outbox-changed";

export function readOutbox(): OutboxItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as OutboxItem[];
  } catch {
    return [];
  }
}

function write(items: OutboxItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full or blocked */
  }
  window.dispatchEvent(new Event(OUTBOX_EVENT));
}

export function addToOutbox(fd: FormData, op: "create" | "update" = "create"): boolean {
  const get = (k: string) => String(fd.get(k) ?? "");
  const item: OutboxItem = {
    id: crypto.randomUUID(),
    op,
    record_id: op === "update" ? get("id") : undefined,
    type: get("type"),
    book_id: get("book_id"),
    category_id: get("category_id"),
    amount: get("amount"),
    occurred_on: get("occurred_on"),
    payment_method: get("payment_method"),
    description: get("description"),
    saved_at: Date.now(),
  };
  if (!item.amount || (op === "create" && !item.book_id) || (op === "update" && !item.record_id)) return false;
  write([...readOutbox(), item]);
  return true;
}

export function deleteLater(recordId: string) {
  write([
    ...readOutbox(),
    { id: crypto.randomUUID(), op: "delete", record_id: recordId, type: "", book_id: "", category_id: "", amount: "", occurred_on: "", payment_method: "", description: "", saved_at: Date.now() },
  ]);
}

export function removeFromOutbox(id: string) {
  write(readOutbox().filter((i) => i.id !== id));
}

/** Upload everything waiting. Returns how many went up. */
export async function flushOutbox(): Promise<number> {
  let sent = 0;
  for (const item of readOutbox()) {
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const out = (await res.json().catch(() => ({}))) as { ok?: boolean; drop?: boolean };
      // Uploaded, or rejected for good (bad data): either way stop retrying it.
      if (out.ok || out.drop) {
        removeFromOutbox(item.id);
        if (out.ok) sent++;
      }
    } catch {
      break; // still offline
    }
  }
  return sent;
}
