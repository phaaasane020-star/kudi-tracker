import Link from "next/link";

export default function Footer({ signedIn = true, owner = false, tone = "light" }: { signedIn?: boolean; owner?: boolean; tone?: "light" | "plain" }) {
  const year = new Date().getFullYear();
  return (
    <footer className={`border-t border-line ${tone === "light" ? "bg-wash" : ""}`}>
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red text-sm font-bold text-white">₵</span>
          <p className="leading-tight">
            <span className="block font-semibold">© {year} Kudi Tracker</span>
            <span className="block text-xs text-muted">
              Powered by{" "}
              <a href="https://paatech.vercel.app" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-red hover:underline">
                Paa Asane Technologies
              </a>
            </span>
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-muted sm:justify-end">
          {signedIn ? (
            <>
              {owner && (
                <Link href="/security" className="hover:text-ink">
                  Security
                </Link>
              )}
              <Link href="/settings" className="hover:text-ink">
                MoMo Sync
              </Link>
              <Link href="/account" className="hover:text-ink">
                Account &amp; data
              </Link>
              <Link href="/guide" className="hover:text-ink">
                How to use Kudi
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-ink">
                Sign in
              </Link>
              <Link href="/forgot" className="hover:text-ink">
                Forgot password
              </Link>
            </>
          )}
          <Link href="/privacy" className="hover:text-ink">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms of Use
          </Link>
        </nav>
      </div>
    </footer>
  );
}
