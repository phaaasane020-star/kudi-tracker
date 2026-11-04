import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LEGAL_CONTACT } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Use · Kudi Tracker" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro="These are the rules for using Kudi Tracker. By creating an account or using the app, you agree to them. If you don't agree, please don't use Kudi Tracker."
    >
      <h2>What Kudi Tracker is</h2>
      <p>
        Kudi Tracker is a tool for writing down and adding up the money you spend and receive. It is powered by Paa Asane Technologies. It is not a bank, a
        Mobile Money service or a payment app: it cannot send, receive or hold money, and it never has access to your wallet or bank account.
      </p>

      <h2>Not financial advice</h2>
      <p>
        Totals, budgets and charts in Kudi are there to help you see your spending. They are not financial, tax or legal advice. Please check important numbers
        against your MoMo and bank statements before relying on them.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be at least 18 years old to create an account.</li>
        <li>Use a real email address that belongs to you, and a strong password you don&apos;t use anywhere else.</li>
        <li>Keep your password and your MoMo Sync secret link private. You&apos;re responsible for what happens in your account.</li>
        <li>If you think someone else has used your account, change your password and use “Sign out on all devices” straight away.</li>
      </ul>

      <h2>Approval</h2>
      <p>
        New accounts must be approved by the owner of this Kudi Tracker before they can be used. The owner may decline an account, or remove access later, for
        example if these terms are broken or the account looks fake. You can delete your own account at any time from{" "}
        <Link href="/account">Account &amp; data</Link>.
      </p>

      <h2>MoMo Sync</h2>
      <ul>
        <li>Only forward Mobile Money messages for wallets that belong to you.</li>
        <li>
          Kudi reads these messages automatically and does its best to record them correctly, but networks word their messages differently and can change them
          without notice. A message may occasionally be skipped, put in the wrong category or read wrongly. Please check your records, and correct or add
          anything that&apos;s missing.
        </li>
        <li>Cash you spend is never recorded automatically. You add it yourself.</li>
      </ul>

      <h2>Fair use</h2>
      <p>Please don&apos;t:</p>
      <ul>
        <li>try to get into anyone else&apos;s account or records;</li>
        <li>try to break, overload or get around the app&apos;s security;</li>
        <li>use fake or throwaway email addresses, or someone else&apos;s details;</li>
        <li>use Kudi for anything illegal, including hiding the source of money.</li>
      </ul>

      <h2>Your information</h2>
      <p>
        Your records belong to you. How we keep and protect them is explained in the <Link href="/privacy">Privacy Policy</Link>, which is part of these terms.
      </p>

      <h2>The service</h2>
      <p>
        We work to keep Kudi Tracker running and your records safe, but the app is provided “as it is”. It may sometimes be unavailable, for example during
        updates or when one of our providers has a problem. We may add, change or remove features. Downloading your records as Excel or PDF from time to time is
        a good way to keep your own copy.
      </p>

      <h2>Limits of responsibility</h2>
      <p>
        As far as the law allows, Paa Asane Technologies is not responsible for losses that come from relying on Kudi&apos;s numbers, from a message being read
        wrongly, from the app being unavailable, or from someone using your password or MoMo Sync link. Nothing in these terms takes away rights you have under
        Ghanaian law that can&apos;t be taken away.
      </p>

      <h2>Ending</h2>
      <p>
        You can stop using Kudi and delete your account at any time. We may suspend or remove an account that breaks these terms. If Kudi Tracker ever closes
        for good, we&apos;ll try to give you notice so you can download your records first.
      </p>

      <h2>Law</h2>
      <p>These terms are governed by the laws of the Republic of Ghana.</p>

      <h2>Changes and contact</h2>
      <p>
        If we change these terms, we&apos;ll update the date at the top of this page, and tell you in the app if the change is important. Questions? Email{" "}
        <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>.
      </p>
    </LegalPage>
  );
}
