import type { APIRoute } from 'astro';
import feedback from '../../data/feedback.json';

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(feedback), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const newEntry = {
      id: `fb-${Date.now()}`,
      name: body.name ?? 'Anonim',
      company: body.company ?? '',
      rating: Number(body.rating) || 5,
      text: body.text ?? '',
      service: body.service ?? 'Lainnya',
      date: new Date().toISOString().split('T')[0],
    };
    return new Response(JSON.stringify({ success: true, data: newEntry }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'Invalid payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
