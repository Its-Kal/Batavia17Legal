import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// GET: list semua profile (admin only)
export const GET: APIRoute = async ({ request }) => {
  try {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, v.join('=')];
      })
    );
    const accessToken = cookies['sb-access-token'];
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Verify user is admin_utama
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(accessToken);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin_utama') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const { data: profiles, error: listErr } = await supabase
      .from('profiles').select('*').order('created_at', { ascending: false });

    if (listErr) return new Response(JSON.stringify({ error: listErr.message }), { status: 500 });

    return new Response(JSON.stringify({ profiles }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

// POST: create user baru
export const POST: APIRoute = async ({ request }) => {
  try {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, v.join('=')];
      })
    );
    const accessToken = cookies['sb-access-token'];
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Verify user is admin_utama
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(accessToken);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin_utama') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const body = await request.json();
    const { full_name, email, password, role, is_active } = body;

    if (!full_name || !email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Create user via admin API
    const { data: authData, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), { status: 400 });
    }

    if (!authData.user) {
      return new Response(JSON.stringify({ error: 'User creation failed' }), { status: 500 });
    }

    // Upsert profile
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      email,
      full_name,
      role,
      is_active: is_active !== false,
    });

    if (profileErr) {
      return new Response(JSON.stringify({ error: 'User created but profile failed: ' + profileErr.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true, user_id: authData.user.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

// DELETE: hapus user
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, v.join('=')];
      })
    );
    const accessToken = cookies['sb-access-token'];
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(accessToken);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin_utama') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const { id } = await request.json();
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    // Jangan izinkan hapus diri sendiri
    if (id === user.id) {
      return new Response(JSON.stringify({ error: 'Tidak bisa hapus akun sendiri' }), { status: 400 });
    }

    const { error: deleteErr } = await supabase.auth.admin.deleteUser(id);
    if (deleteErr) {
      return new Response(JSON.stringify({ error: deleteErr.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
