import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../utils/supabase';

export const prerender = false;

function normalize(header: string): string {
  return header.trim().toLowerCase().replace(/[\s\-_]+/g, '_').replace(/^#/, '');
}

function findCol(headers: string[], ...candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.indexOf(c);
    if (idx !== -1) return idx;
  }
  return -1;
}

function extractTitleFromDriveUrl(url: string): string {
  // Format: https://drive.google.com/file/d/FILEID/view?usp=drivesdk
  const match = String(url).match(/\/file\/d\/([^/]+)\//);
  if (match) return `Video ${match[1].slice(0, 8).toUpperCase()}`;
  return '';
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { spreadsheet_id, sheet_name } = body;

    if (!spreadsheet_id?.trim() || !sheet_name?.trim()) {
      return new Response(
        JSON.stringify({
          error:
            'Spreadsheet ID dan Sheet Name wajib diisi.\n' +
            'Spreadsheet ID dari URL:\n' +
            'https://docs.google.com/spreadsheets/d/XXXXX/edit → XXXXX',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = import.meta.env.GOOGLE_SHEETS_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            'GOOGLE_SHEETS_API_KEY belum diset.\n' +
            'Setup di Vercel Dashboard → Settings → Environment Variables.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Fetch sheet data ---
    const safeSheetName = encodeURIComponent(sheet_name.trim());
    const sheetRange = `${safeSheetName}!A1:Z1000`;
    const sheetsUrl =
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id.trim()}/values/${sheetRange}?key=${apiKey}`;

    const sheetsRes = await fetch(sheetsUrl);
    const sheetsData = await sheetsRes.json();

    if (!sheetsRes.ok || sheetsData.error) {
      const msg =
        sheetsData.error?.message ??
        'Gagal mengambil data dari Google Sheets. Pastikan spreadsheet di-share "Anyone with the link".';
      return new Response(JSON.stringify({ error: msg }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const values: string[][] = sheetsData.values ?? [];
    if (values.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Sheet kosong atau hanya ada header.' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Parse headers (flexible matching) ---
    const rawHeaders = values[0];
    const headers = rawHeaders.map(normalize);

    // Find column indices — most specific names first (headers are matched in order)
    const videoUrlIdx  = findCol(headers, 'video_link', 'video_url', 'video', 'videolink', 'url');
    const captionIdx   = findCol(headers, 'captions', 'caption', 'captions_text');
    const hashtagIdx   = findCol(headers, 'hastag', 'hashtags', 'hashtag', 'tags');
    const titleIdx     = findCol(headers, 'title', 'name', 'video_title', 'judul');

    // Must have at least a video URL or caption
    if (videoUrlIdx === -1 && captionIdx === -1) {
      return new Response(
        JSON.stringify({
          error:
            'Kolom "video link" atau "Captions" tidak ditemukan.\n' +
            'Kolom yang tersedia: ' + rawHeaders.join(', '),
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Parse data rows ---
    const now = new Date().toISOString();
    const toInsert: Record<string, unknown>[] = [];

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const get = (idx: number) => (idx >= 0 && idx < row.length ? String(row[idx]).trim() : '');

      const rawCaption  = get(captionIdx);
      const rawHashtags = get(hashtagIdx);
      const rawVideoUrl = get(videoUrlIdx);
      const rawTitle    = get(titleIdx);

      // Skip fully empty rows
      if (!rawCaption && !rawVideoUrl) continue;

      // Generate title: use explicit title col, else derive from Drive URL, else use caption prefix
      let title = rawTitle;
      if (!title?.trim()) {
        title = extractTitleFromDriveUrl(rawVideoUrl);
      }
      if (!title?.trim()) {
        title = rawCaption?.slice(0, 60).trim() || `Video ${i}`;
      }

      // Parse hashtags: comma / space / # separated
      const tagList = rawHashtags
        ? rawHashtags
            .split(/[,\s]+/)
            .map((t: string) => t.trim().replace(/^#+/, ''))
            .filter((t: string) => t.length > 0 && t.length <= 30)
        : [];

      toInsert.push({
        title: title.trim(),
        video_url:    rawVideoUrl || null,
        caption:      rawCaption || null,
        hashtags:     tagList,
        thumbnail_url: null,
        category:     'TikTok',
        display_order: i - 1,
        synced_at:    now,
        is_active:    true,
      });
    }

    if (toInsert.length === 0) {
      return new Response(
        JSON.stringify({
          error:
            'Tidak ada data video yang bisa di-sync.\n' +
            'Pastikan kolom "Captions" atau "video link" terisi.',
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Clear old data and insert new ---
    await supabaseAdmin
      .from('video_ads')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    const { data, error } = await supabaseAdmin
      .from('video_ads')
      .insert(toInsert)
      .select();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Gagal menyimpan: ' + error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: toInsert.length,
        columns_used: rawHeaders.join(', '),
        message: `Berhasil sync ${toInsert.length} video dari sheet "${sheet_name}".`,
        data,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[sync-videos]', err);
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
