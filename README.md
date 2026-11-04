# Kudi Tracker

Track every cedi you spend and earn, with separate Personal and Business books.

## Setup

1. Create a project at supabase.com.
2. In Supabase, open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and click **Run**.
3. Copy `.env.example` to `.env.local` and fill in the three values from **Project Settings → API**. The `service_role` key is only for automatic MoMo recording, so keep it secret.
4. In Supabase, open **Authentication → URL Configuration** and set:
   - Site URL: `http://localhost:3000` (change it to your Vercel URL after you deploy)
   - Redirect URLs: `http://localhost:3000/auth/callback` and `https://YOUR-APP.vercel.app/auth/callback`
5. Run:
   ```bash
   npm install
   npm run dev
   ```
6. Open http://localhost:3000, create an account, and confirm your email.

## Deploy

Push the project to GitHub and import it in Vercel. Add all three variables from `.env.local` in Vercel's Environment Variables.

On your phone, open the site and choose **Add to Home screen**. It then opens like an app.

## Automatic MoMo recording

Your phone forwards each Mobile Money SMS to `/api/sms?token=...`. The app reads it and records the payment, and duplicates are ignored. Open **Auto MoMo** in the app to copy your link and see the setup steps for Android and iPhone. The phone needs your live Vercel link, because it can't reach localhost.

- Payments and transfers out become money out, and money received becomes money in.
- Fees and e-levy are recorded under MoMo Charges.
- Cash out records only the fee. Cash in is ignored, because it's your own money.
- Anything the app can't place gets "Pick a category". Tap the record to fix it.

## Pages

- **Overview**: totals for the month, a daily spending chart, spending per category with budgets, a quick add form, and recent records.
- **Transactions**: every record for the month, with filters, delete, and Excel/PDF export.
- **Budgets**: add categories, set monthly budgets, and hide ones you don't use.
- **Auto MoMo**: your secret link, phone setup, paste-a-message test, and a log of every SMS received.
