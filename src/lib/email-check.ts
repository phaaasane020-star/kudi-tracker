import "server-only";
import { resolveMx } from "node:dns/promises";

// Throwaway inboxes people use to sign up without a real email.
const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "sharklasers.com", "10minutemail.com",
  "10minutemail.net", "temp-mail.org", "tempmail.com", "tempmail.net", "tempmailo.com", "tempr.email",
  "throwawaymail.com", "yopmail.com", "yopmail.net", "trashmail.com", "trashmail.de", "getnada.com",
  "nada.email", "dispostable.com", "maildrop.cc", "mailnesia.com", "mintemail.com", "mohmal.com",
  "emailondeck.com", "fakeinbox.com", "fakemail.net", "spamgourmet.com", "mytemp.email", "moakt.com",
  "burnermail.io", "inboxkitten.com", "1secmail.com", "1secmail.net", "1secmail.org", "emailfake.com",
  "tmail.ws", "tmpmail.org", "tmpmail.net", "mail.tm", "mailpoof.com", "byom.de", "discard.email",
  "dropmail.me", "linshiyouxiang.net", "spam4.me", "grr.la", "pokemail.net", "harakirimail.com",
  "example.com", "example.org", "example.net", "test.com", "test.org", "email.com", "domain.com",
]);

/**
 * Checks an email is real enough to sign up with: correct shape, not a throwaway
 * inbox, and its domain actually receives email (has MX records).
 * The confirmation link Supabase sends is the final proof the inbox is theirs.
 */
export async function checkSignupEmail(email: string): Promise<string | null> {
  const e = email.trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e) || e.length > 200 || e.includes("..")) {
    return "Use a real email address.";
  }
  const domain = e.split("@")[1];
  if (DISPOSABLE.has(domain) || [...DISPOSABLE].some((d) => domain.endsWith("." + d))) {
    return "Use a real email address.";
  }
  try {
    const mx = await Promise.race([
      resolveMx(domain),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);
    if (!mx || mx.length === 0) return "Check your email spelling.";
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA" || code === "NXDOMAIN") {
      return "Check your email spelling.";
    }
    // DNS was slow or unreachable: don't block a real person; the confirmation email still has to be opened.
  }
  return null;
}
