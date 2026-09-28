import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { url, referrer } = body;

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    );

    // Get user from cookie if logged in
    const cookieHeader = request.headers.get('cookie') ?? '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, v.join('=')];
      })
    );
    const accessToken = cookies['sb-access-token'];
    let userId: string | null = null;

    if (accessToken) {
      const { data } = await supabase.auth.getUser(accessToken);
      userId = data.user?.id ?? null;
    }

    const { error } = await supabase.from('whatsapp_clicks').insert({
      user_id: userId,
      page_url: url ?? null,
      referrer: referrer ?? null,
    });

    return new Response(JSON.stringify({ ok: !error }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
