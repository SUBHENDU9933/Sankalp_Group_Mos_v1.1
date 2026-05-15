// Vercel serverless — Production Publishing Engine for Sankalp Marketing Hub.
// Real multi-platform publishing: Facebook, Instagram, Google Business Profile,
// YouTube, X (Twitter), Threads. Captures per-platform errors and updates the DB.
//
// Required Supabase columns on `integrations`:
//   platform, access_token, refresh_token, account_id, account_name, metadata, is_connected
// `metadata` (jsonb) may store: page_id, ig_business_id, location_id, account_id (GBP),
// channel_id (YouTube), threads_user_id, x_user_id, expires_at, etc.

import supabase from './_supabase.js';
import {
  classifyMedia,
  refreshGoogleToken,
  fmtErr,
  pollMetaContainer,
} from './_publish_helpers.js';

// =========================================================================
// FACEBOOK PAGE — POST FEED OR PHOTO
// =========================================================================
async function publishFacebook(intg, post, media) {
  const token = intg.access_token;
  const pageId = intg.metadata?.page_id || intg.account_id;
  if (!token || !pageId) return { ok: false, error: 'missing page_id or access_token' };
  if (token.startsWith('EAAB_mock')) return { ok: true, mode: 'mock' };

  const content = post.content_en || post.content || '';
  const mediaType = classifyMedia(media[0]);

  // Photo upload
  if (media[0] && mediaType === 'image') {
    const r = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: media[0], caption: content, access_token: token }),
    });
    const d = await r.json();
    return r.ok ? { ok: true, id: d.post_id || d.id, url: `https://facebook.com/${d.post_id || d.id}` }
                : { ok: false, error: fmtErr(d) };
  }

  // Video upload (small video via source URL)
  if (media[0] && mediaType === 'video') {
    const r = await fetch(`https://graph-video.facebook.com/v19.0/${pageId}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_url: media[0], description: content, access_token: token }),
    });
    const d = await r.json();
    return r.ok ? { ok: true, id: d.id } : { ok: false, error: fmtErr(d) };
  }

  // Text-only feed post
  const r = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: content, access_token: token }),
  });
  const d = await r.json();
  return r.ok ? { ok: true, id: d.id, url: `https://facebook.com/${d.id}` }
              : { ok: false, error: fmtErr(d) };
}

// =========================================================================
// INSTAGRAM BUSINESS — TWO-STEP CONTAINER + PUBLISH
// =========================================================================
async function publishInstagram(intg, post, media) {
  const token = intg.access_token;
  const igId = intg.metadata?.ig_business_id || intg.account_id;
  if (!token || !igId) return { ok: false, error: 'missing ig_business_id' };
  if (token.startsWith('EAAB_mock')) return { ok: true, mode: 'mock' };
  if (!media[0]) return { ok: false, error: 'Instagram requires at least one image/video' };

  const content = post.content_en || post.content || '';
  const mediaType = classifyMedia(media[0]);
  const isReel = post.post_type === 'reel' || mediaType === 'video';

  const containerBody = { caption: content, access_token: token };
  if (mediaType === 'video') {
    containerBody.media_type = isReel ? 'REELS' : 'VIDEO';
    containerBody.video_url = media[0];
  } else {
    containerBody.image_url = media[0];
  }

  const c1 = await fetch(`https://graph.facebook.com/v19.0/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(containerBody),
  });
  const c1d = await c1.json();
  if (!c1.ok || !c1d.id) return { ok: false, error: fmtErr(c1d) };

  // For video/reels we MUST poll until FINISHED before publishing.
  if (mediaType === 'video') {
    const poll = await pollMetaContainer(c1d.id, token);
    if (!poll.ok) return { ok: false, error: `IG container failed: ${fmtErr(poll.data)}` };
  }

  const c2 = await fetch(`https://graph.facebook.com/v19.0/${igId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: c1d.id, access_token: token }),
  });
  const c2d = await c2.json();
  return c2.ok ? { ok: true, id: c2d.id, container: c1d.id }
               : { ok: false, error: fmtErr(c2d) };
}

// =========================================================================
// GOOGLE BUSINESS PROFILE — LOCAL POST
// =========================================================================
async function publishGoogleBusiness(intg, post, media) {
  let token = intg.access_token;
  if (!token) return { ok: false, error: 'not connected' };

  // Build URL: requires account_id and location_id from metadata.
  const accountId = intg.metadata?.gbp_account_id;
  const locationId = intg.metadata?.location_id;
  if (!accountId || !locationId) {
    return { ok: false, error: 'Missing gbp_account_id or location_id in integration.metadata. Run the GBP location picker in Settings → Integrations.' };
  }

  const content = post.content_en || post.content || '';
  const body = {
    languageCode: 'en',
    summary: content,
    topicType: post.post_type === 'offer' ? 'OFFER' : 'STANDARD',
  };
  if (media[0]) body.media = [{ mediaFormat: 'PHOTO', sourceUrl: media[0] }];

  const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/localPosts`;
  let r = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  // 401? refresh token and retry once.
  if (r.status === 401) {
    token = await refreshGoogleToken(intg);
    r = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  const d = await r.json();
  return r.ok ? { ok: true, name: d.name } : { ok: false, error: fmtErr(d) };
}

// =========================================================================
// YOUTUBE — VIDEO UPLOAD (resumable, source URL fetched server-side)
// =========================================================================
async function publishYouTube(intg, post, media) {
  let token = intg.access_token;
  if (!token) return { ok: false, error: 'not connected' };

  const videoUrl = (media || []).find(u => classifyMedia(u) === 'video');
  if (!videoUrl) return { ok: false, error: 'YouTube requires a video file in media' };

  // Fetch the video as binary
  let videoRes;
  try {
    videoRes = await fetch(videoUrl);
    if (!videoRes.ok) return { ok: false, error: `Failed to fetch video: ${videoRes.status}` };
  } catch (e) {
    return { ok: false, error: `Video fetch failed: ${e.message}` };
  }
  const videoBuf = Buffer.from(await videoRes.arrayBuffer());

  const title = (post.title || post.content_en || post.content || 'Untitled').slice(0, 95);
  const description = post.content_en || post.content || '';

  // 1. Initialize resumable upload
  const initBody = {
    snippet: { title, description, categoryId: '22' }, // 22 = People & Blogs
    status: { privacyStatus: post.metadata?.youtube_privacy || 'public', selfDeclaredMadeForKids: false },
  };

  let initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': videoRes.headers.get('content-type') || 'video/*',
      'X-Upload-Content-Length': String(videoBuf.length),
    },
    body: JSON.stringify(initBody),
  });

  if (initRes.status === 401) {
    token = await refreshGoogleToken(intg);
    initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': videoRes.headers.get('content-type') || 'video/*',
        'X-Upload-Content-Length': String(videoBuf.length),
      },
      body: JSON.stringify(initBody),
    });
  }
  if (!initRes.ok) {
    const d = await initRes.json().catch(() => ({}));
    return { ok: false, error: fmtErr(d, `init upload failed: ${initRes.status}`) };
  }
  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) return { ok: false, error: 'No upload URL returned from YouTube init' };

  // 2. Upload binary
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': videoRes.headers.get('content-type') || 'video/*' },
    body: videoBuf,
  });
  const ud = await uploadRes.json().catch(() => ({}));
  return uploadRes.ok ? { ok: true, id: ud.id, url: `https://youtu.be/${ud.id}` }
                      : { ok: false, error: fmtErr(ud) };
}

// =========================================================================
// X (TWITTER) — POST TWEET (text-only for V1; media requires v1.1 upload)
// =========================================================================
async function publishX(intg, post, media) {
  const token = intg.access_token;
  if (!token) return { ok: false, error: 'not connected' };

  const content = (post.content_en || post.content || '').slice(0, 280);
  const body = { text: content };

  // Media upload on X requires v1.1 endpoint + OAuth 1.0a signing — out of scope for V1 simple flow.
  // If you have OAuth 2.0 user-context with media.write scope, attach pre-uploaded media IDs here.
  if (media[0] && intg.metadata?.media_ids?.length) {
    body.media = { media_ids: intg.metadata.media_ids };
  }

  const r = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok) return { ok: false, error: fmtErr(d) };
  const id = d.data?.id;
  return { ok: true, id, url: id ? `https://x.com/${intg.account_name || 'i'}/status/${id}` : undefined };
}

// =========================================================================
// THREADS — TWO-STEP CONTAINER + PUBLISH (Meta Threads Graph API)
// =========================================================================
async function publishThreads(intg, post, media) {
  const token = intg.access_token;
  const userId = intg.metadata?.threads_user_id || intg.account_id;
  if (!token || !userId) return { ok: false, error: 'missing threads_user_id' };

  const content = post.content_en || post.content || '';
  const mediaType = classifyMedia(media[0]);

  const containerBody = {
    text: content,
    access_token: token,
  };
  if (media[0] && mediaType === 'image') {
    containerBody.media_type = 'IMAGE';
    containerBody.image_url = media[0];
  } else if (media[0] && mediaType === 'video') {
    containerBody.media_type = 'VIDEO';
    containerBody.video_url = media[0];
  } else {
    containerBody.media_type = 'TEXT';
  }

  const c1 = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(containerBody),
  });
  const c1d = await c1.json();
  if (!c1.ok || !c1d.id) return { ok: false, error: fmtErr(c1d) };

  // Threads recommends a short wait before publishing (~30s for media)
  if (mediaType === 'video') {
    await new Promise(r => setTimeout(r, 15000));
  } else if (mediaType === 'image') {
    await new Promise(r => setTimeout(r, 5000));
  }

  const c2 = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: c1d.id, access_token: token }),
  });
  const c2d = await c2.json();
  return c2.ok ? { ok: true, id: c2d.id, container: c1d.id }
               : { ok: false, error: fmtErr(c2d) };
}

// =========================================================================
// MAIN HANDLER
// =========================================================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Cron-Secret');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id required' });

  // Fetch post
  const { data: post, error: pErr } = await supabase.from('posts').select('*').eq('id', id).single();
  if (pErr || !post) return res.status(404).json({ error: 'post not found' });

  // Fetch all integrations once
  const { data: integrations } = await supabase.from('integrations').select('*');
  const byPlatform = Object.fromEntries((integrations || []).map(i => [i.platform, i]));

  const results = {};
  const media = post.media_urls || [];
  const platforms = post.platforms || [];

  const dispatcher = {
    facebook: publishFacebook,
    instagram: publishInstagram,
    google: publishGoogleBusiness,
    gbp: publishGoogleBusiness,
    youtube: publishYouTube,
    x: publishX,
    twitter: publishX,
    threads: publishThreads,
  };

  // Publish in parallel (each platform is independent)
  await Promise.all(platforms.map(async (platform) => {
    const intg = byPlatform[platform];
    if (!intg) { results[platform] = { ok: false, error: 'integration row missing' }; return; }
    if (!intg.is_connected) { results[platform] = { ok: false, error: 'not connected' }; return; }

    const fn = dispatcher[platform];
    if (!fn) { results[platform] = { ok: false, error: `Unsupported platform: ${platform}` }; return; }

    try {
      results[platform] = await fn(intg, post, media);
    } catch (e) {
      results[platform] = { ok: false, error: String(e.message || e) };
    }
  }));

  // Determine overall status
  const allOk = platforms.length > 0 && platforms.every(p => results[p]?.ok);
  const anyOk = Object.values(results).some(r => r?.ok);
  const allMock = Object.values(results).length > 0 && Object.values(results).every(r => r?.mode === 'mock');

  let status;
  if (allOk && !allMock) status = 'published';
  else if (anyOk && !allMock) status = 'partial';
  else if (allMock) status = 'pending_connection';
  else status = 'failed';

  const update = {
    status,
    metadata: { ...(post.metadata || {}), publish_results: results, last_publish_attempt: new Date().toISOString() },
  };
  if (status === 'published' || status === 'partial') update.published_at = new Date().toISOString();

  await supabase.from('posts').update(update).eq('id', id);

  return res.status(200).json({ ok: anyOk, status, results });
}
