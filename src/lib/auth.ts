import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The signed-in user, checked from the signature on their session token.
 * With Supabase's signing keys this happens on our server in about a
 * millisecond, instead of a round trip to Supabase on every tap.
 * Falls back to asking Supabase when the token can't be checked locally.
 */
export async function verifiedUser(supabase: SupabaseClient): Promise<{ id: string; email: string | null } | null> {
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!error && claims?.sub) return { id: claims.sub, email: (claims.email as string | undefined) ?? null };
  return null;
}
