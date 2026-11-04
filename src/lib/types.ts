export type TxType = "expense" | "income";

export type Book = {
  id: string;
  name: string;
  kind: "personal" | "business";
  currency: string;
};

export type Category = {
  id: string;
  book_id: string;
  name: string;
  type: TxType;
  color: string;
  monthly_budget: number | null;
  archived: boolean;
};

export type Transaction = {
  id: string;
  book_id: string;
  category_id: string | null;
  type: TxType;
  amount: number;
  occurred_on: string;
  description: string | null;
  payment_method: string;
  source: "manual" | "sms";
  needs_review: boolean;
  counterparty: string | null;
  created_at: string;
};
