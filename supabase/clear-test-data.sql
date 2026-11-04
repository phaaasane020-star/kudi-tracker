-- Kudi Tracker: start fresh.
-- Deletes every record and every received SMS, so the app starts empty.
-- Keeps your account, your Personal and Business books, your categories,
-- your budgets and your Auto MoMo link.
-- This cannot be undone. Run it once in Supabase: SQL Editor -> New query -> Run.

delete from public.transactions;
delete from public.sms_inbox;
update public.sms_settings set last_received_at = null;
