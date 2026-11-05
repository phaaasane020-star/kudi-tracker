import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { verifiedUser } from "@/lib/auth";
import { PAYMENT_METHODS } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

/** Uploads a record that was added on the phone while offline. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifiedUser(supabase);
  if (!user) return NextResponse.json({ ok: false, error: "Signed out" }, { status: 401 });

  let b: Record<string, string> = {};
  try {
    b = await request.json();
  } catch {
    return NextResponse.json({ ok: false, drop: true, error: "Bad data" }, { status: 400 });
  }

  const op = b.op === "update" || b.op === "delete" ? b.op : "create";
  if (op === "delete") {
    if (!/^[0-9a-f-]{36}$/.test(b.record_id ?? "")) return NextResponse.json({ ok: false, drop: true }, { status: 400 });
    await supabase.from("transactions").delete().eq("id", b.record_id); // database rules: only your own
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  }

  const amount = Number(String(b.amount ?? "").replace(/,/g, ""));
  const bad =
    !/^[0-9a-f-]{36}$/.test(b.id ?? "") ||
    (op === "create" && (!["expense", "income"].includes(b.type) || !b.book_id)) ||
    (op === "update" && !/^[0-9a-f-]{36}$/.test(b.record_id ?? "")) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(b.occurred_on ?? "") ||
    !PAYMENT_METHODS.some((p) => p.value === b.payment_method) ||
    String(b.description ?? "").length > 200;
  if (bad) return NextResponse.json({ ok: false, drop: true, error: "Bad data" }, { status: 400 });

  if (op === "update") {
    const { error } = await supabase
      .from("transactions")
      .update({
        category_id: b.category_id || null,
        amount: Math.round(amount * 100) / 100,
        occurred_on: b.occurred_on,
        payment_method: b.payment_method,
        description: b.description?.trim() || null,
        needs_review: false,
      })
      .eq("id", b.record_id);
    if (error) return NextResponse.json({ ok: false, drop: error.code === "42501", error: error.message }, { status: 400 });
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    book_id: b.book_id,
    category_id: b.category_id || null,
    type: b.type,
    amount: Math.round(amount * 100) / 100,
    occurred_on: b.occurred_on,
    payment_method: b.payment_method,
    description: b.description?.trim() || null,
    reference: `offline:${b.id}`, // the same offline record can never be saved twice
  });

  if (error && error.code !== "23505") {
    // Database rules said no (for example the book isn't yours): don't keep retrying.
    return NextResponse.json({ ok: false, drop: error.code === "42501", error: error.message }, { status: 400 });
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
