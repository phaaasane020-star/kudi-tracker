import { AlertCircle, BookOpen, ChevronRight, ClipboardPaste, Download, Home, KeyRound, Lock, Minus, PencilLine, PieChart, Plus, ShieldCheck, Smartphone, Tag, Trash2, UserCheck, Wallet } from "lucide-react";
import Link from "next/link";
import AppShell, { link } from "@/components/AppShell";
import TourButton from "@/components/TourButton";
import { loadCategories, loadContext, type PageParams } from "@/lib/data";

type Guide = {
  icon: typeof Plus;
  title: string;
  summary: string;
  steps: React.ReactNode[];
  tip?: React.ReactNode;
};

export default async function GuidePage({ searchParams }: { searchParams: Promise<PageParams> }) {
  const { supabase, book, month, access } = await loadContext(await searchParams);
  const categories = await loadCategories(supabase, book.id);
  const to = (path: string) => link(path, book.kind, month);
  const go = (path: string, label: string) => (
    <Link href={to(path)} className="font-semibold text-red underline-offset-2 hover:underline">
      {label}
    </Link>
  );

  const sections: { title: string; items: Guide[] }[] = [
    {
      title: "Start here",
      items: [
        {
          icon: BookOpen,
          title: "What Kudi does",
          summary: "A notebook for your money that adds things up for you.",
          steps: [
            "You write down money you spend and money you receive.",
            "Kudi adds it all up, so you can see how much you spent this month and what it went on.",
            "MoMo payments can be written down for you automatically. Cash you add yourself, in a few taps.",
          ],
        },
        {
          icon: Wallet,
          title: "Personal and Business",
          summary: "Two separate notebooks, so your own money and work money don't mix.",
          steps: [
            <>At the top of the screen, tap <b>Personal</b> or <b>Business</b>.</>,
            "Everything you then see and add goes into that one.",
            "Switch back any time. Nothing is lost.",
          ],
        },
      ],
    },
    {
      title: "Every day",
      items: [
        {
          icon: Minus,
          title: "Add money you spent (cash)",
          summary: "For anything you paid with cash, like food, transport or a haircut.",
          steps: [
            <>Tap the red <b>+</b> button at the bottom of the screen. On a computer, tap <b>Add a record</b> on the left.</>,
            <>Check that <b>Money out</b> is red at the top.</>,
            <>Type the amount, or tap a quick amount like <b>10</b> or <b>20</b>.</>,
            <>Tap what it was for, for example <b>Food</b>.</>,
            <>Under <b>Paid with</b>, tap <b>Cash</b>.</>,
            <>It is set to <b>Today</b>. If it was yesterday, tap <b>Yesterday</b>.</>,
            <>Tap <b>Save money out</b>. You will see it on Home and in Records.</>,
          ],
          tip: "Add it right after you pay, while you still remember the amount.",
        },
        {
          icon: Plus,
          title: "Add money you received",
          summary: "Salary, allowance, a gift, or money from a customer.",
          steps: [
            <>Tap the red <b>+</b> button.</>,
            <>Tap <b>Money in</b> at the top. It turns green.</>,
            "Type the amount.",
            <>Tap where it came from, for example <b>Allowance / Salary</b> or <b>Gift</b>.</>,
            <>Tap <b>Save money in</b>.</>,
          ],
        },
        {
          icon: PencilLine,
          title: "Fix a mistake or delete a record",
          summary: "Wrong amount, wrong category, or added twice.",
          steps: [
            <>Open {go("/transactions", "Records")}.</>,
            "Find the record and tap it.",
            <>Change what is wrong, then tap <b>Save changes</b>.</>,
            <>To remove it completely, tap <b>Delete this record</b> at the bottom.</>,
          ],
        },
        {
          icon: Tag,
          title: "What “Choose a category” means",
          summary: "Kudi recorded a MoMo payment but couldn't tell what it was for.",
          steps: [
            "This is normal. Not every MoMo message says what the money was for.",
            <>On Home, tap the orange bar that says <b>MoMo records need a category</b>.</>,
            <>Tap each record, tap the right category, then tap <b>Save changes</b>.</>,
          ],
          tip: "When you pay with MoMo, type a word like “food” or “transport” as the reference. Kudi will then choose the category for you.",
        },
      ],
    },
    {
      title: "MoMo",
      items: [
        {
          icon: Smartphone,
          title: "Record MoMo payments automatically",
          summary: "Set it up once. After that, every MoMo payment adds itself.",
          steps: [
            <>Open {go("/settings", "Auto MoMo")} and tap <b>Copy</b> next to your secret link.</>,
            <>On iPhone, open the <b>Shortcuts</b> app, then <b>Automation</b>, then <b>+</b>, then <b>Message</b>.</>,
            <>Choose <b>Message Contains</b>, type <b>GHS</b>, then choose <b>Run Immediately</b>.</>,
            <>Add the action <b>Get Contents of URL</b> and paste your link. Set Method to <b>POST</b> and Request Body to <b>JSON</b>.</>,
            <>Add a field called <b>text</b> set to the message content, and a field called <b>from</b> set to the sender.</>,
            "Save. Send yourself GH₵1 to test it. It should appear in Kudi within a few seconds.",
          ],
          tip: "The Auto MoMo page has the same steps for Android phones. Keep your secret link private.",
        },
        {
          icon: ClipboardPaste,
          title: "Add an old MoMo message",
          summary: "For payments from before you set up automatic recording.",
          steps: [
            "In your phone's Messages app, press and hold the MoMo message, then tap Copy.",
            <>Open {go("/settings", "Auto MoMo")} and scroll to <b>Record a message by pasting it</b>.</>,
            <>Paste the message into the box and tap <b>Record this message</b>.</>,
            <>Kudi tells you what it recorded and where. Tap <b>See it</b> to open it.</>,
          ],
        },
        {
          icon: AlertCircle,
          title: "My MoMo payment isn't showing",
          summary: "Usually it's in another month or the other notebook.",
          steps: [
            <>Check the month at the top. A message dated last month goes into last month. Tap <b>‹</b> to go back.</>,
            <>Check <b>Personal</b> and <b>Business</b>. MoMo goes into the one chosen on the Auto MoMo page.</>,
            <>On {go("/settings", "Auto MoMo")}, look at <b>Messages received</b>. It says if a message was recorded, skipped, or already there.</>,
            "Cash deposits are not counted as money in, and cash withdrawals only count the fee. You add what you spend that cash on yourself.",
          ],
        },
      ],
    },
    {
      title: "Plan your money",
      items: [
        {
          icon: PieChart,
          title: "Set a budget",
          summary: "A monthly limit for a category, like GH₵400 for food.",
          steps: [
            <>Open {go("/categories", "Budgets")}.</>,
            "Find the category and type your limit in the box next to it.",
            <>Tap <b>Save</b>.</>,
            "On Home, the bar turns red when you spend more than your limit.",
          ],
        },
        {
          icon: Home,
          title: "See where your money went",
          summary: "Home shows your month at a glance.",
          steps: [
            "The big brown box shows what you spent, what came in, and what is left.",
            <><b>Day by day</b> shows which days you spent the most.</>,
            <><b>Where it went</b> lists your categories, biggest first.</>,
            <>In {go("/transactions", "Records")}, tap <b>Money out</b>, <b>Money in</b> or <b>Cash</b> to see just those.</>,
          ],
        },
        {
          icon: Download,
          title: "Download your records",
          summary: "Get an Excel sheet or a PDF to keep or share.",
          steps: [
            <>Open {go("/transactions", "Records")} and pick the month.</>,
            <>Tap <b>Excel</b> or <b>PDF</b>. The file downloads to your phone or computer.</>,
          ],
        },
      ],
    },
    {
      title: "Your account",
      items: [
        {
          icon: KeyRound,
          title: "Forgot your password",
          summary: "You can choose a new one with your email.",
          steps: [
            <>On the sign-in page, tap <b>Forgot password?</b></>,
            <>Type your email and tap <b>Send reset link</b>.</>,
            "Open the email and tap the link. Check spam if you can't find it.",
            "Choose a new strong password. The list under the box shows what it needs.",
          ],
        },
        {
          icon: Trash2,
          title: "Delete things",
          summary: "You can delete anything you've added, from one record to your whole account.",
          steps: [
            <>One record: open {go("/transactions", "Records")}, tap the record, then tap <b>Delete this record</b>.</>,
            <>A category: open {go("/categories", "Budgets")} and tap <b>Delete</b> next to it. Its records stay, just without a category.</>,
            <>A MoMo message: open {go("/settings", "Auto MoMo")} and tap <b>Delete</b> next to it, or <b>Clear all</b>.</>,
            <>A whole month, a whole book, or everything: open {go("/account", "Account & data")}.</>,
            <>Every delete button asks twice. Tap once and it turns red and says <b>Tap again</b>. Tap again to delete. If you change your mind, just wait and it goes back.</>,
          ],
          tip: "Deleted things can't be brought back, so download your records as Excel or PDF first if you might need them.",
        },
        {
          icon: Lock,
          title: "Keep your account safe",
          summary: "A few simple habits.",
          steps: [
            "Never tell anyone your password, not even a friend.",
            "Never share your Auto MoMo secret link.",
            <>On a shared phone or computer, tap <b>Sign out</b> when you finish.</>,
            <>If you think someone knows your password, change it from {go("/account", "Account & data")}.</>,
          ],
        },
        {
          icon: Smartphone,
          title: "Put Kudi on your home screen",
          summary: "Open it like an app, with one tap.",
          steps: [
            "On iPhone, open Kudi in Safari.",
            <>Tap the <b>Share</b> button, then <b>Add to Home Screen</b>, then <b>Add</b>.</>,
            "Kudi now has its own icon on your home screen.",
          ],
        },
      ],
    },
  ];

  if (access.isOwner) {
    sections.push({
      title: "For you, the owner",
      items: [
        {
          icon: UserCheck,
          title: "Approve new people",
          summary: "Nobody can use Kudi until you say yes.",
          steps: [
            <>When someone signs up, a red number appears on {go("/people", "People")}.</>,
            <>Open People and tap <b>Approve</b> or <b>Decline</b>.</>,
            <>To stop someone later, tap <b>Remove access</b>.</>,
            "People you approve only ever see their own money, never yours.",
          ],
        },
        {
          icon: ShieldCheck,
          title: "Check who is visiting",
          summary: "Visits, sign-ins and wrong passwords.",
          steps: [
            <>Open {go("/security", "Security")}.</>,
            "The top box says if anything needs your attention.",
            "Scroll down to see every sign-in and visit, with the town and device.",
          ],
        },
      ],
    });
  }

  let count = 0;
  return (
    <AppShell path="/guide" book={book} month={month} categories={categories} title="Help" showMonth={false}>
      <div className="mx-auto max-w-3xl space-y-7">
        <section className="rise rounded-[20px] bg-brown p-5 text-cream sm:p-7">
          <h2 className="display text-[clamp(1.75rem,5vw,2.5rem)] leading-tight">How to use Kudi</h2>
          <p className="mt-2 max-w-lg text-[16px] leading-relaxed text-cream/80">
            Short, simple steps for everything in the app. Tap a question to open it.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <TourButton href={to("/") + "&tour=1"} className="btn" />
          </div>
        </section>

        {sections.map((section, s) => (
          <section key={section.title} className="rise" style={{ ["--i" as string]: s + 1 }}>
            <h2 className="section-title mb-2.5 px-1">{section.title}</h2>
            <ul className="boxed">
              {section.items.map((g) => {
                const first = count++ === 0;
                return (
                  <li key={g.title}>
                    <details className="guide-item group" open={first}>
                      <summary className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-wash">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-red">
                          <g.icon size={19} strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[16px] font-semibold leading-snug">{g.title}</span>
                          <span className="block text-[14px] text-muted">{g.summary}</span>
                        </span>
                        <ChevronRight size={20} className="guide-chevron shrink-0 text-muted" />
                      </summary>
                      <div className="px-4 pb-5 pl-[68px]">
                        <ol className="space-y-2.5">
                          {g.steps.map((st, n) => (
                            <li key={n} className="flex gap-3 text-[16px] leading-relaxed">
                              <span className="tabular mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brown text-[13px] font-semibold text-cream">
                                {n + 1}
                              </span>
                              <span>{st}</span>
                            </li>
                          ))}
                        </ol>
                        {g.tip && (
                          <p className="mt-4 rounded-xl border-l-[3px] border-orange bg-cream px-3.5 py-2.5 text-[15px] leading-relaxed">
                            <b>Tip:</b> {g.tip}
                          </p>
                        )}
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <p className="px-1 pb-2 text-[15px] text-muted">
          Still stuck? Ask the person who invited you to Kudi, or watch the tour again from the top of this page.
        </p>
      </div>
    </AppShell>
  );
}
