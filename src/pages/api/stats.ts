import type { APIRoute } from 'astro';
import stats from '../../data/stats.json';

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    return new Response(
      JSON.stringify({ success: true, message: 'Stats recorded', echo: body }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'Invalid payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
