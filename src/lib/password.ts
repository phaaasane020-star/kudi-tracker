/**
 * Password rules, shared by the live meter in the form and the server check,
 * so both always agree.
 */
export type PasswordCheck = { label: string; ok: boolean };

const COMMON = [
  "password", "passw0rd", "123456", "12345678", "123456789", "1234567890", "qwerty", "qwertyuiop",
  "abc123", "111111", "000000", "iloveyou", "admin", "welcome", "letmein", "monkey", "dragon",
  "football", "baseball", "sunshine", "princess", "ghana", "accra", "kumasi", "tarkwa", "jesus",
  "god", "kudi", "kuditracker", "momo", "mtn", "telecel", "vodafone",
];

export function passwordChecks(password: string, email = ""): PasswordCheck[] {
  const lower = password.toLowerCase();
  const name = email.split("@")[0]?.toLowerCase() ?? "";
  return [
    { label: "10+ characters", ok: password.length >= 10 },
    { label: "A–Z and a–z", ok: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "A number", ok: /\d/.test(password) },
    { label: "A symbol (!@#?)", ok: /[^A-Za-z0-9]/.test(password) },
    {
      label: "Not easy to guess",
      ok:
        password.length > 0 &&
        !COMMON.some((w) => lower.replace(/[^a-z0-9]/g, "").includes(w) && lower.length < w.length + 6) &&
        !(name.length >= 3 && lower.includes(name)) &&
        !/^(.)\1+$/.test(password),
    },
  ];
}

export function isStrongPassword(password: string, email = ""): boolean {
  return passwordChecks(password, email).every((c) => c.ok);
}

/** 0 to 4, for the strength bar. */
export function passwordScore(password: string, email = ""): number {
  if (!password) return 0;
  const passed = passwordChecks(password, email).filter((c) => c.ok).length;
  return Math.max(1, Math.min(4, passed - 1));
}
