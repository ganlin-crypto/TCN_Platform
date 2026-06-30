import { supabase } from './supabase';
import { Role } from './types';

// ─── Sign In ──────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<{
  role: Role | null;
  error: string | null;
}> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { role: null, error: error.message };
  const role = (data.user?.user_metadata?.role ?? null) as Role | null;
  return { role, error: null };
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ─── Session / Role ───────────────────────────────────────────────────────────

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentRole(): Promise<Role | null> {
  const { data } = await supabase.auth.getSession();
  return (data.session?.user?.user_metadata?.role as Role) ?? null;
}

// ─── Role → Path ──────────────────────────────────────────────────────────────

export function roleToHref(role: Role): string {
  const map: Record<Role, string> = {
    tct_owner:   '/tct-owner/dashboard',
    participant: '/participant/dashboard',
    submitter:   '/submitter/dashboard',
    admin:       '/admin',
  };
  return map[role] ?? '/login';
}
