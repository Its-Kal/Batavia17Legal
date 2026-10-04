import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../utils/supabase';

interface SheetRow {
  title?: string;
  video_url?: string;
  thumbnail_url?: string;
  caption?: string;
  hashtags?: string;
  category?: string;
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
            'Contoh Spreadsheet ID: https://docs.google.com/spreadsheets/d/XXXXXXX/edit → XXXXXXX\n' +
            'Sheet Name default: Sheet1',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const apiKey = import.meta.env.GOOGLE_SHEETS_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            'GOOGLE_SHEETS_API_KEY belum diset di environment variables.\n' +
            'Dapatkan API key dari: https://console.cloud.google.com/apis/credentials',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch from Google Sheets API v4
    const sheetRange = `${encodeURIComponent(sheet_name.trim())}!A1:Z1000`;
    const sheetsUrl =
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id.trim()}/values/${sheetRange}` +
      `?key=${apiKey}`;

    const sheetsRes = await fetch(sheetsUrl);
    const sheetsData = await sheetsRes.json();

    if (!sheetsRes.ok || sheetsData.error) {
      const msg = sheetsData.error?.message ?? 'Gagal mengambil data dari Google Sheets.';
      return new Response(JSON.stringify({ error: msg }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const values: string[][] = sheetsData.values ?? [];
    if (values.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Sheet kosong atau hanya ada header.' }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse header row
    const headers = values[0].map((h) =>
      String(h).trim().toLowerCase().replace(/\s+/g, '_')
    );

    const titleIdx = headers.indexOf('title');
    const videoUrlIdx = headers.indexOf('video_url');
    const thumbnailUrlIdx = headers.indexOf('thumbnail_url');
    const captionIdx = headers.indexOf('caption');
    const hashtagsIdx = headers.indexOf('hashtags');
    const categoryIdx = headers.indexOf('category');

    if (titleIdx === -1) {
      return new Response(
        JSON.stringify({
          error:
            'Kolom "title" tidak ditemukan di sheet.\n' +
            'Header yang tersedia: ' + headers.join(', '),
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse rows
    const rows: SheetRow[] = values.slice(1).map((row) => {
      const get = (idx: number) => (idx >= 0 && idx < row.length ? row[idx] : '');
      return {
        title: get(titleIdx),
        video_url: get(videoUrlIdx),
        thumbnail_url: get(thumbnailUrlIdx),
        caption: get(captionIdx),
        hashtags: get(hashtagsIdx),
        category: get(categoryIdx),
      };
    });

    // Filter out empty rows
    const validRows = rows.filter((r) => r.title?.trim());

    // Upsert: delete all and re-insert (simple sync strategy)
    await supabaseAdmin.from('video_ads').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const now = new Date().toISOString();
    const toInsert = validRows.map((r, idx) => {
      // Parse hashtags: comma or space separated, filter empty
      const rawTags = r.hashtags ?? '';
      const tagList = rawTags
        .split(/[,\s#]+/)
        .map((t) => t.trim().replace(/^#/, ''))
        .filter((t) => t.length > 0 && t.length <= 30);

      return {
        title: String(r.title).trim(),
        video_url: String(r.video_url).trim() || null,
        thumbnail_url: String(r.thumbnail_url).trim() || null,
        caption: String(r.caption).trim() || null,
        hashtags: tagList,
        category: String(r.category).trim() || 'general',
        display_order: idx,
        synced_at: now,
      };
    });

    const { data, error } = await supabaseAdmin
      .from('video_ads')
      .insert(toInsert)
      .select();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Gagal menyimpan ke database: ' + error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const skipped = rows.length - validRows.length;

    return new Response(
      JSON.stringify({
        success: true,
        synced: validRows.length,
        skipped,
        total_rows: rows.length,
        message: `Berhasil sync ${validRows.length} video${skipped > 0 ? ` (${skipped} baris dilewati karena tanpa judul)` : ''}`,
        data,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('[sync-videos]', err);
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
