// Shared helpers for publishing — token refresh, media classification, error formatting.
// NOT a serverless function (underscore prefix). Imported by publish.js.

import supabase from './_supabase.js';

/**
 * Determine if a URL is an image or video based on extension.
 */
export function classifyMedia(url) {
  if (!url) return 'none';
  const lower = url.split('?')[0].toLowerCase();
  if (/\.(mp4|mov|m4v|webm|avi)$/.test(lower)) return 'video';
  if (/\.(jpg|jpeg|png|gif|webp|bmp)$/.test(lower)) return 'image';
  return 'image'; // safe default
}

/**
 * Refresh a Google OAuth access token using the stored refresh_token.
 * Updates the integrations row in-place and returns the new access_token.
 */
export async function refreshGoogleToken(integration) {
  if (!integration?.refresh_token) return integration?.access_token || null;
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const data = await r.json();
    if (!r.ok || !data.access_token) return integration.access_token;
    await supabase.from('integrations').update({
      access_token: data.access_token,
      metadata: { ...(integration.metadata || {}), expires_in: data.expires_in, refreshed_at: new Date().toISOString() },
    }).eq('id', integration.id);
    return data.access_token;
  } catch (e) {
    return integration.access_token;
  }
}

/**
 * Refresh a Meta long-lived token (Facebook/Instagram/Threads).
 * Meta tokens are 60-day long-lived; refresh extends another 60 days.
 */
export async function refreshMetaToken(integration) {
  if (!integration?.access_token) return null;
  // Mock tokens never refresh
  if (integration.access_token.startsWith('EAAB_mock')) return integration.access_token;
  // Only refresh if we know it's near expiry; for now just return current token.
  // Real implementation: call /oauth/access_token?grant_type=fb_exchange_token
  return integration.access_token;
}

/**
 * Pull a fresh integration row from DB (after a token refresh elsewhere).
 */
export async function freshIntegration(platform) {
  const { data } = await supabase.from('integrations').select('*').eq('platform', platform).maybeSingle();
  return data || null;
}

/**
 * Standardised error formatter from various API JSON shapes.
 */
export function fmtErr(d, fallback = 'unknown error') {
  if (!d) return fallback;
  if (typeof d === 'string') return d;
  if (d.error?.message) return d.error.message;
  if (d.error_description) return d.error_description;
  if (d.errors?.[0]?.message) return d.errors[0].message;
  if (d.message) return d.message;
  try { return JSON.stringify(d).slice(0, 500); } catch { return fallback; }
}

/**
 * Poll Meta media-container status until it's FINISHED or ERROR.
 * Required for Instagram videos/reels and Threads videos.
 */
export async function pollMetaContainer(containerId, accessToken, { maxAttempts = 8, delayMs = 2500 } = {}) {
  for (let i = 0; i < maxAttempts; i++) {
    const r = await fetch(`https://graph.facebook.com/v19.0/${containerId}?fields=status_code,status&access_token=${accessToken}`);
    const d = await r.json();
    if (d.status_code === 'FINISHED') return { ok: true, data: d };
    if (d.status_code === 'ERROR' || d.status_code === 'EXPIRED') return { ok: false, data: d };
    await new Promise(res => setTimeout(res, delayMs));
  }
  return { ok: false, data: { status: 'timeout' } };
}
