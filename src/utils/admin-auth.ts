---
import { supabase } from '../utils/supabase';

export interface SessionUser {
  id: string;
  email: string;
  role: 'admin_utama' | 'staff';
}

export async function getSessionUser(Astro: any): Promise<SessionUser | null> {
  const accessToken = Astro.cookies.get('sb-access-token')?.value;
  const refreshToken = Astro.cookies.get('sb-refresh-token')?.value;

  if (!accessToken) return null;

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? '',
    role: (profile?.role as 'admin_utama' | 'staff') ?? 'staff',
  };
}

export function requireAuth(user: SessionUser | null): void {
  if (!user) throw new Error('Unauthorized');
}
