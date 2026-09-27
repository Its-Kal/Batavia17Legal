import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ success: false, message: 'Message required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Mock AI response (in production, call Mistral AI)
    const responses = [
      'Terima kasih atas pertanyaannya. Berdasarkan kasus yang Anda sampaikan, saya sarankan untuk menyiapkan dokumen kronologis dan menghubungi mitra kami untuk konsultasi mendalam.',
      'Saya memahami kekhawatiran Anda. Dalam situasi seperti ini, langkah pertama yang penting adalah mengumpulkan bukti pendukung. Tim kami siap mendampingi.',
      'Pertanyaan Anda penting. Kami akan menghubungkan Anda dengan pengacara spesialis yang relevan. Sementara itu, mohon jaga kerahasiaan kasus ini.',
    ];

    const reply = responses[Math.floor(Math.random() * responses.length)];

    return new Response(
      JSON.stringify({
        success: true,
        reply,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'Invalid request' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
};
