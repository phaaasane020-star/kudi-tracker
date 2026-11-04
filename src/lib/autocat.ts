/**
 * Guesses a category from the name and reference on a MoMo SMS.
 * Each rule lists category names to try in order; the first one that exists
 * in the book wins. Anything unmatched is left for you to categorise.
 */
type Rule = { match: RegExp; names: string[] };

const EXPENSE_RULES: Rule[] = [
  { match: /\b(airtime|data|bundle|mtn ?(?:data|bundle)|telecel ?(?:airtime|data)|internet|wifi|surfline|busy)\b/i, names: ["Airtime & Data", "Internet & Data"] },
  { match: /\b(ecg|electricity|prepaid|ghana water|gwcl|water bill|rent|landlord|nedco|gas|lpg)\b/i, names: ["Rent & Utilities"] },
  { match: /\b(uber|bolt|yango|taxi|trotro|okada|transport|fare|vip|stc|fuel|shell|goil|total ?energies|star oil|petrol)\b/i, names: ["Transport"] },
  { match: /\b(food|chop|waakye|jollof|kfc|pizza|chicken|restaurant|eatery|canteen|kitchen|fast ?food|relax ?and ?bite|papaye|bakery|shop ?rite|melcom|supermarket|market)\b/i, names: ["Food"] },
  { match: /\b(school|fees|tuition|umat|university|hostel|books?|printing|photocopy)\b/i, names: ["School & Books"] },
  { match: /\b(church|tithe|offering|seed|donation|mosque)\b/i, names: ["Church & Giving"] },
  { match: /\b(hospital|clinic|pharmacy|chemist|nhis|drug|medic)\b/i, names: ["Health"] },
  { match: /\b(dstv|gotv|netflix|showmax|spotify|cinema|game|betway|sportybet)\b/i, names: ["Entertainment", "Software & Subscriptions"] },
  { match: /\b(vercel|netlify|hostinger|namecheap|porkbun|domain|hosting|aws|google cloud)\b/i, names: ["Hosting & Domains"] },
  { match: /\b(github|figma|canva|openai|anthropic|claude|subscription|adobe|microsoft)\b/i, names: ["Software & Subscriptions"] },
  { match: /\b(boutique|clothing|clothes|fashion|tailor|shoes|seamstress)\b/i, names: ["Clothing"] },
];

const INCOME_RULES: Rule[] = [
  { match: /\b(allowance|salary|pay ?roll|wages|stipend|upkeep)\b/i, names: ["Allowance / Salary"] },
  { match: /\b(website|web|project|design|deposit|invoice|client|development)\b/i, names: ["Client Projects"] },
  { match: /\b(maintenance|retainer|monthly fee)\b/i, names: ["Maintenance & Retainers"] },
  { match: /\b(gift|birthday|congrat)/i, names: ["Gift"] },
];

export function guessCategory(
  type: "expense" | "income",
  text: string,
  categories: { id: string; name: string; type: string; archived: boolean }[]
): string | null {
  const available = categories.filter((c) => c.type === type && !c.archived);
  const byName = new Map(available.map((c) => [c.name.toLowerCase(), c.id]));

  // A category whose own name appears in the text wins ("Gym" in "Reference: gym").
  for (const c of available) {
    if (c.name.length >= 3 && new RegExp(`\\b${escape(c.name)}\\b`, "i").test(text)) return c.id;
  }

  for (const rule of type === "expense" ? EXPENSE_RULES : INCOME_RULES) {
    if (!rule.match.test(text)) continue;
    for (const n of rule.names) {
      const id = byName.get(n.toLowerCase());
      if (id) return id;
    }
  }
  return null;
}

export function feeCategory(categories: { id: string; name: string; type: string }[]): string | null {
  const names = ["momo charges", "bank & momo charges"];
  for (const n of names) {
    const c = categories.find((c) => c.type === "expense" && c.name.toLowerCase() === n);
    if (c) return c.id;
  }
  return null;
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
