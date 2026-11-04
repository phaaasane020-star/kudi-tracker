import "server-only";
import { redirect } from "next/navigation";
import { verifiedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { currentMonth, isMonth, monthRange } from "@/lib/format";
import type { Book, Category, Transaction } from "@/lib/types";

export type PageParams = { book?: string; month?: string };

/**
 * Loads the signed-in user, makes sure their books exist, and picks the book
 * and month from the URL (?book=personal|business&month=YYYY-MM).
 */
export async function loadContext(params: PageParams) {
  const supabase = await createClient();
  const user = await verifiedUser(supabase);
  if (!user) redirect("/login");

  let { data: books } = await supabase.from("books").select("id,name,kind,currency").order("kind", { ascending: false });
  if (!books || books.length === 0) {
    const { error } = await supabase.rpc("ensure_setup");
    if (error) throw new Error("Could not set up your account: " + error.message);
    ({ data: books } = await supabase.from("books").select("id,name,kind,currency").order("kind", { ascending: false }));
  }

  const allBooks = (books ?? []) as Book[];
  const kind = params.book === "business" ? "business" : "personal";
  const book = allBooks.find((b) => b.kind === kind) ?? allBooks[0];
  if (!book) throw new Error("No books found for this account.");

  const month = isMonth(params.month) ? params.month : currentMonth();

  return { supabase, user, books: allBooks, book, month };
}

export async function loadCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookId: string
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,book_id,name,type,color,monthly_budget,archived")
    .eq("book_id", bookId)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((c) => ({
    ...c,
    monthly_budget: c.monthly_budget === null ? null : Number(c.monthly_budget),
  })) as Category[];
}

export async function loadMonthTransactions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookId: string,
  month: string
): Promise<Transaction[]> {
  const { start, end } = monthRange(month);
  const { data, error } = await supabase
    .from("transactions")
    .select("id,book_id,category_id,type,amount,occurred_on,description,payment_method,source,needs_review,counterparty,created_at")
    .eq("book_id", bookId)
    .gte("occurred_on", start)
    .lt("occurred_on", end)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as Transaction[];
}
