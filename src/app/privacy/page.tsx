import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LEGAL_CONTACT } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy · Kudi Tracker" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Kudi Tracker helps you keep track of the money you spend and receive. This page explains, in plain words, what information the app keeps, why, who can see it, and how you can remove it."
    >
      <h2>Who runs Kudi Tracker</h2>
      <p>
        Kudi Tracker is powered by Paa Asane Technologies, based in Tarkwa, Ghana. If you have a question about your information, email{" "}
        <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>.
      </p>

      <h2>What we keep</h2>
      <ul>
        <li>
          <b>Your account:</b> your email address and your password. Your password is stored scrambled (hashed) by our sign-in provider, so nobody can read it,
          not even us. If you sign in with Google, we receive your name and email from Google.
        </li>
        <li>
          <b>Your money records:</b> the amounts, dates, categories, notes, payment method and budgets you add, in your Personal and Business books.
        </li>
        <li>
          <b>MoMo messages you choose to send us:</b> if you set up MoMo Sync or paste a message, we receive the text of that Mobile Money SMS. We use it only
          to create a record for you. We keep the raw message for 30 days so you can check what was recorded, then delete it. The record made from it stays
          until you delete it. When a message holds someone&apos;s phone or account number inside its reference, we leave that number out of the record.
        </li>
        <li>
          <b>Security information:</b> when someone visits the app or tries to sign in, we note the time, the page, the email used (for sign-in attempts), the
          IP address, the approximate city and country it came from, and the type of device and browser. This lets us block people who keep guessing passwords
          and spot anything suspicious. Visit records are deleted after 90 days.
        </li>
      </ul>

      <h2>What we don&apos;t do</h2>
      <ul>
        <li>We don&apos;t sell or rent your information to anyone.</li>
        <li>We don&apos;t show you adverts, and we don&apos;t use your records for advertising.</li>
        <li>We can&apos;t see, move or touch the money in your MoMo wallet or bank account. Kudi only reads the messages you forward to it.</li>
        <li>We don&apos;t read your other text messages. Your phone only sends us the messages your MoMo Sync setup is told to send.</li>
      </ul>

      <h2>Who can see your information</h2>
      <ul>
        <li>
          <b>You.</b> Your records are locked to your account. Other people using Kudi Tracker can never see them.
        </li>
        <li>
          <b>The owner of this Kudi Tracker</b> approves new accounts and sees the security log: emails used to sign in or sign up, and where and on which device
          visits and sign-in attempts came from. The app does not show the owner your records, categories or budgets. As the person who runs the service, the
          owner has technical access to the database and only looks at stored data to fix a problem or when the law requires it.
        </li>
        <li>
          <b>Service providers</b> that run the app for us: Supabase (database and sign-in), Vercel (hosting) and, if you use it, Google (sign-in). They store or
          process information only to provide their service.
        </li>
        <li>
          <b>The authorities</b>, only if Ghanaian law requires us to share something.
        </li>
      </ul>

      <h2>Cookies and storage on your device</h2>
      <p>
        Kudi uses a small number of cookies to keep you signed in and to count visits without identifying you by name. It also stores a few settings on your
        device, such as whether you&apos;ve already seen the opening animation and the guided tour. We don&apos;t use advertising or tracking cookies.
      </p>

      <h2>How we protect it</h2>
      <p>
        Everything is sent over an encrypted connection (HTTPS). Database rules make sure each account can only reach its own records, new accounts must be
        approved before they can use the app, strong passwords are required, and sign-in is locked for 15 minutes after 5 wrong passwords. No system is
        perfectly secure, so please also keep your password and your MoMo Sync link private.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>
          <b>See and download your records</b> at any time from Records, as Excel or PDF.
        </li>
        <li>
          <b>Correct</b> any record by tapping it.
        </li>
        <li>
          <b>Delete</b> one record, a month, a whole book, all your records, your MoMo messages, or your whole account from{" "}
          <Link href="/account">Account &amp; data</Link>. Deleting your account removes your records, categories, budgets and MoMo settings for good.
        </li>
        <li>
          <b>Stop MoMo Sync</b> any time by turning it off on the MoMo Sync page, or by deleting the automation on your phone.
        </li>
        <li>
          <b>Ask us</b> what we hold about you, or to delete it, by emailing <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>.
        </li>
      </ul>

      <h2>Ghana&apos;s data protection law</h2>
      <p>
        We aim to handle personal information in line with Ghana&apos;s Data Protection Act, 2012 (Act 843). If you think we haven&apos;t, please contact us first
        so we can put it right. You can also contact the Data Protection Commission of Ghana.
      </p>

      <h2>Children</h2>
      <p>Kudi Tracker is not meant for children under 18, and we don&apos;t knowingly accept accounts from them.</p>

      <h2>Changes to this policy</h2>
      <p>
        If we change this policy, we&apos;ll update the date at the top of this page. If a change is important, we&apos;ll tell you in the app before it takes
        effect.
      </p>
    </LegalPage>
  );
}
