import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../utils/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      title,
      video_url,
      thumbnail_url,
      caption,
      hashtags,
      category,
      is_active,
      display_order,
    } = body;

    if (!title?.trim()) {
      return new Response(JSON.stringify({ error: 'Judul video wajib diisi.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabaseAdmin
      .from('video_ads')
      .insert({
        title: title.trim(),
        video_url: video_url?.trim() || null,
        thumbnail_url: thumbnail_url?.trim() || null,
        caption: caption?.trim() || null,
        hashtags: Array.isArray(hashtags) ? hashtags : [],
        category: category?.trim() || 'general',
        is_active: Boolean(is_active),
        display_order: Number(display_order) || 0,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      id,
      title,
      video_url,
      thumbnail_url,
      caption,
      hashtags,
      category,
      is_active,
      display_order,
    } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID video wajib diisi.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!title?.trim()) {
      return new Response(JSON.stringify({ error: 'Judul video wajib diisi.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabaseAdmin
      .from('video_ads')
      .update({
        title: title.trim(),
        video_url: video_url?.trim() || null,
        thumbnail_url: thumbnail_url?.trim() || null,
        caption: caption?.trim() || null,
        hashtags: Array.isArray(hashtags) ? hashtags : [],
        category: category?.trim() || 'general',
        is_active: Boolean(is_active),
        display_order: Number(display_order) || 0,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Video tidak ditemukan.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID video wajib diisi.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabaseAdmin.from('video_ads').delete().eq('id', id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
