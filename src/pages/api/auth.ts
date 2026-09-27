import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Demo credentials — in production, use proper auth (DB, JWT, hashing)
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = import.meta.env.ADMIN_PASSWORD || 'batavia17-admin-2026';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      // Generate a simple session token (in production use crypto.randomUUID + signed JWT)
      const token = Buffer.from(`${username}:${Date.now()}:b17`).toString('base64');
      return new Response(
        JSON.stringify({ success: true, token, user: { username, role: 'admin' } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Username atau password salah' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid request' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
