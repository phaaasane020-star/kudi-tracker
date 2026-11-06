import Link from "next/link";
import Footer from "@/components/Footer";

/**
 * Layout for sign-in, forgot password and new password.
 * Phones: one column. Tablets and computers: brand panel on the left, form on the right.
 */
export default function AuthShell({
  heading,
  text,
  signedIn = false,
  aside,
  children,
}: {
  heading: string;
  text: string;
  signedIn?: boolean;
  /** Extra content under the heading in the brown panel (tablets and computers). */
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="page-enter grid flex-1 md:grid-cols-2 lg:grid-cols-[1.1fr_1fr]">
        <section className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-brown p-10 text-cream md:flex lg:px-14 lg:py-12">
          <Link href={signedIn ? "/" : "/login"} className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red text-xl font-bold text-white">₵</span>
            <span className="text-lg font-bold">Kudi Tracker</span>
          </Link>
          <div className="rise max-w-md">
            <p className={`display font-bold leading-[0.95] ${aside ? "text-[clamp(2.25rem,3.6vw,3.25rem)]" : "text-[clamp(2.5rem,4.5vw,4rem)]"}`}>{heading}</p>
            <p className={`text-cream/75 ${aside ? "mt-3 text-base" : "mt-5 text-lg"}`}>{text}</p>
            {aside && <div className="mt-7 max-w-sm">{aside}</div>}
          </div>
          <a href="https://paatech.vercel.app" target="_blank" rel="noopener noreferrer" className="text-sm text-cream/50 hover:text-cream hover:underline">
            Powered by Paa Asane Technologies
          </a>
          <span aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full border-[40px] border-red/15" />
        </section>

        <section className="flex flex-col px-5 py-6 sm:px-10 sm:py-8 md:justify-center md:py-12 lg:px-16">
          <Link href={signedIn ? "/" : "/login"} className="mb-5 flex items-center gap-2.5 md:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red text-lg font-bold text-white">₵</span>
            <span className="text-lg font-bold">Kudi Tracker</span>
          </Link>
          <div className="w-full max-w-sm sm:max-w-md md:mx-auto md:max-w-sm lg:max-w-md">{children}</div>
        </section>
      </main>
      <Footer signedIn={signedIn} />
    </div>
  );
}
