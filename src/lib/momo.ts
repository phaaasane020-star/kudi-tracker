/**
 * Reads Mobile Money SMS (MTN MoMo, Telecel Cash, AirtelTigo Money) and pulls out
 * what happened. Pure function, no I/O, so it can be tested on its own.
 *
 * kind:
 *   sent      money left your wallet to pay someone or buy something  -> expense
 *   received  money came into your wallet from someone                -> income
 *   cashout   you withdrew to physical cash (not spending)            -> only the fee is an expense
 *   cashin    you deposited physical cash (not income)                -> nothing recorded
 */
export type MomoKind = "sent" | "received" | "cashout" | "cashin";

export type ParsedMomo = {
  kind: MomoKind;
  provider: "MTN MoMo" | "Telecel Cash" | "AT Money" | "Mobile Money";
  amount: number;
  fee: number;
  tax: number;
  counterparty: string | null;
  note: string | null;
  txnId: string | null;
  date: string | null; // YYYY-MM-DD when the SMS has one
  balance: number | null;
};

export type ParseResult = { ok: true; data: ParsedMomo } | { ok: false; reason: string };

const CUR = String.raw`(?:GHS|GH₵|GH¢|GHC|¢|₵)`;
const NUM = String.raw`(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)`;
const MONEY = `${CUR}\\s?${NUM}`;

const money = (s: string | undefined) => (s ? Number(s.replace(/,/g, "")) : NaN);

function first(text: string, patterns: RegExp[]): RegExpMatchArray | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m;
  }
  return null;
}

function provider(text: string, sender?: string): ParsedMomo["provider"] {
  const s = `${sender ?? ""} ${text}`.toLowerCase();
  if (/telecel|t-?cash|vodafone/.test(s)) return "Telecel Cash";
  if (/airteltigo|at ?money|tigo/.test(s)) return "AT Money";
  if (/mobilemoney|mtn|momo/.test(s)) return "MTN MoMo";
  return "Mobile Money";
}

function cleanName(raw: string | undefined): string | null {
  if (!raw) return null;
  const name = raw
    .replace(/\b(?:\+?233|0)\d{9}\b/g, "") // phone numbers
    .replace(/\s{2,}/g, " ")
    .replace(/[\s.,:;-]+$/g, "")
    .trim();
  if (!name || name.length < 2) return null;
  // MTN sends names in capitals: KOFI MENSAH -> Kofi Mensah
  if (name === name.toUpperCase()) {
    return name.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
  }
  return name;
}

// Words that end a name: "to KOFI MENSAH 0244123456 has been ...", "to ECG. Current Balance"
const NAME_END = String.raw`(?=\s+(?:\+?233|0)\d{9}\b|\s*[.,;]\s|\s*[.,;]?$|\s+(?:has|on|at|with|via|for|current|your|reference|ref|transaction|trans|fee|is|was|successful|completed)\b)`;

export function parseMomoSms(textRaw: string, sender?: string): ParseResult {
  const text = textRaw.replace(/\s+/g, " ").trim();
  if (!text) return { ok: false, reason: "Empty message" };
  if (!new RegExp(CUR, "i").test(text)) return { ok: false, reason: "No cedi amount in the message" };

  if (/\b(failed|unsuccessful|not successful|insufficient|declined|cancelled|could not be completed)\b/i.test(text)) {
    return { ok: false, reason: "Failed or declined transaction" };
  }
  if (/\b(reversed|reversal)\b/i.test(text)) {
    return { ok: false, reason: "Reversal (add it yourself if needed)" };
  }
  if (/\b(otp|verification code|one[- ]time)\b/i.test(text)) {
    return { ok: false, reason: "Code message, not a payment" };
  }

  let kind: MomoKind | null = null;
  let amountMatch: RegExpMatchArray | null = null;

  const cashIn = first(text, [
    new RegExp(`cash[ -]?in(?: received)?(?: for| of)?\\s*${MONEY}`, "i"),
    new RegExp(`you have deposited\\s*${MONEY}`, "i"),
  ]);
  const cashOut = first(text, [
    new RegExp(`cash[ -]?out(?: made)?(?: for| of)?\\s*${MONEY}`, "i"),
    new RegExp(`(?:you have )?withdrawn\\s*${MONEY}`, "i"),
    new RegExp(`withdrawal of\\s*${MONEY}`, "i"),
  ]);
  const received = first(text, [
    new RegExp(`payment received for\\s*${MONEY}`, "i"),
    new RegExp(`you have received\\s*${MONEY}`, "i"),
    new RegExp(`(?:you have been |account )?credited with\\s*${MONEY}`, "i"),
    new RegExp(`received\\s*${MONEY}\\s*from`, "i"),
    new RegExp(`${MONEY}\\s*(?:has been )?received from`, "i"),
  ]);
  const sent = first(text, [
    new RegExp(`payment made for\\s*${MONEY}`, "i"),
    new RegExp(`your payment of\\s*${MONEY}`, "i"),
    new RegExp(`you have (?:sent|paid|transferred|bought|purchased)\\s*${MONEY}`, "i"),
    new RegExp(`(?:sent|paid|transferred)\\s*${MONEY}\\s*to`, "i"),
    new RegExp(`${MONEY}\\s*(?:has been )?(?:sent|paid|transferred) to`, "i"),
    new RegExp(`(?:payment|transfer|purchase) of\\s*${MONEY}`, "i"),
    new RegExp(`debited with\\s*${MONEY}`, "i"),
    new RegExp(`(?:bought|purchased)\\s*${MONEY}`, "i"),
  ]);

  if (cashIn) [kind, amountMatch] = ["cashin", cashIn];
  else if (cashOut) [kind, amountMatch] = ["cashout", cashOut];
  else if (received) [kind, amountMatch] = ["received", received];
  else if (sent) [kind, amountMatch] = ["sent", sent];

  if (!kind || !amountMatch) return { ok: false, reason: "Not a payment or transfer message" };

  const amount = money(amountMatch[1]);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: "Could not read the amount" };

  const fee = money(
    first(text, [
      new RegExp(`(?:transaction )?fee(?: charged| was| is)?\\s*:?\\s*${CUR}?\\s?${NUM}`, "i"),
      new RegExp(`charges?(?: of)?\\s*:?\\s*${MONEY}`, "i"),
    ])?.[1]
  );
  const tax = money(
    first(text, [
      new RegExp(`(?:e-?levy|tax)(?: charged| was| is)?\\s*:?\\s*${CUR}?\\s?${NUM}`, "i"),
    ])?.[1]
  );

  const balance = money(
    first(text, [
      new RegExp(`(?:current|new|available|your new) balance(?: is)?\\s*:?\\s*${MONEY}`, "i"),
      new RegExp(`balance(?: is)?\\s*:?\\s*${MONEY}`, "i"),
    ])?.[1]
  );

  const txnId =
    first(text, [
      /financial transaction id\s*:?\s*([A-Za-z0-9.]{5,})/i,
      /\btransaction id\s*:?\s*([A-Za-z0-9.]{5,})/i,
      /\btrans(?:action)?\.? ?id\s*:?\s*([A-Za-z0-9.]{5,})/i,
      /\btxn ?id\s*:?\s*([A-Za-z0-9.]{5,})/i,
      /\bref(?:erence)? ?(?:no|number|id)\s*:?\s*([A-Za-z0-9]{6,})/i,
      /^([A-Za-z0-9]{8,})\s+confirmed\b/i,
    ])?.[1]?.replace(/\.+$/, "") ?? null;

  let counterparty: string | null = null;
  if (kind === "received" || kind === "cashin") {
    counterparty = cleanName(text.match(new RegExp(`\\bfrom\\s+(.+?)${NAME_END}`, "i"))?.[1]);
  } else {
    const after = text.slice((amountMatch.index ?? 0) + amountMatch[0].length);
    counterparty =
      cleanName(after.match(new RegExp(`^\\s*(?:\\w+\\s+){0,2}?(?:to|at)\\s+(.+?)${NAME_END}`, "i"))?.[1]) ??
      cleanName(text.match(new RegExp(`\\b(?:to|at)\\s+(.+?)${NAME_END}`, "i"))?.[1]);
  }
  if (!counterparty && /airtime/i.test(text)) counterparty = "Airtime";
  if (!counterparty && /\bbundle|data\b/i.test(text)) counterparty = "Data bundle";

  const noteRaw = text.match(
    /\breference\s*:\s*(.*?)(?=\s*\.\s|\s+(?:transaction|trans|financial|your|current|fee|tax|available)\b|$)/i
  )?.[1];
  const note = noteRaw && !/^[\d.\-]*$/.test(noteRaw.trim()) && noteRaw.trim().length <= 120 ? noteRaw.trim() : null;

  const date = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1] ?? dmyToIso(text.match(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/));

  return {
    ok: true,
    data: {
      kind,
      provider: provider(text, sender),
      amount,
      fee: Number.isFinite(fee) ? fee : 0,
      tax: Number.isFinite(tax) ? tax : 0,
      counterparty,
      note,
      txnId,
      date,
      balance: Number.isFinite(balance) ? balance : null,
    },
  };
}

function dmyToIso(m: RegExpMatchArray | null): string | null {
  if (!m) return null;
  const [, d, mo, y] = m;
  if (Number(mo) > 12 || Number(d) > 31) return null;
  return `${y}-${mo}-${d}`;
}
