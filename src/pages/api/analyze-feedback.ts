import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return new Response(
        JSON.stringify({ success: false, message: 'Text required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Simple keyword-based sentiment analysis (placeholder for Mistral AI)
    const positiveWords = ['puas', 'bagus', 'baik', 'membantu', 'profesional', 'cepat', 'ramah'];
    const negativeWords = ['buruk', 'lambat', 'kecewa', 'jelek', 'tidak', 'gagal'];

    const lower = text.toLowerCase();
    const pos = positiveWords.filter(w => lower.includes(w)).length;
    const neg = negativeWords.filter(w => lower.includes(w)).length;

    const sentiment = pos > neg ? 'positive' : neg > pos ? 'negative' : 'neutral';
    const score = (pos - neg) / Math.max(pos + neg, 1);

    const themes = [];
    if (lower.includes('pidana')) themes.push('pidana');
    if (lower.includes('bisnis') || lower.includes('kontrak')) themes.push('bisnis');
    if (lower.includes('keluarga') || lower.includes('perceraian')) themes.push('keluarga');

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          sentiment,
          score,
          themes,
          keywords: [...new Set([...text.match(/\b\w{4,}\b/g) || []])].slice(0, 10),
          recommendation: sentiment === 'negative'
            ? 'Follow-up prioritas diperlukan.'
            : 'Pertahankan kualitas layanan.',
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'Invalid request' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
};
