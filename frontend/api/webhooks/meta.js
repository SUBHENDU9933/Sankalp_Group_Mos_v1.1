// Vercel serverless — Meta Webhooks endpoint.
// Receives webhook events from Facebook Page, Instagram, and WhatsApp Cloud API.
//
// GET  → webhook verification (Meta hits this once when you subscribe a webhook)
// POST → real-time events (messages, comments, mentions, status updates, etc.)
//
// Env vars required on Vercel:
//   META_WEBHOOK_VERIFY_TOKEN   — shared secret you set in the Meta app webhook config
//   META_APP_SECRET             — used to verify X-Hub-Signature-256 on POST events
//
// Webhook URL to register with Meta:
//   https://mos.sankalpinterior.com/api/webhooks/meta

import crypto from 'crypto';
import supabase from '../_supabase.js';

export const config = {
  api: {
    // Disable body parsing so we can read the raw bytes for signature verification.
    bodyParser: false,
  },
};

async function readRawBody(req) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifySignature(rawBody, signatureHeader, appSecret) {
  if (!signatureHeader || !appSecret) return false;
  const expected =
    'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

// Normalise an entry/change/messaging item into a flat row for the `messages` table.
function flattenEvents(payload) {
  const events = [];
  const object = payload.object || 'unknown';
  for (const entry of payload.entry || []) {
    // Facebook Messenger / Instagram DM
    for (const msg of entry.messaging || []) {
      events.push({
        channel: object, // 'page' | 'instagram'
        external_id: msg.message?.mid || msg.postback?.mid || `${entry.id}-${msg.timestamp}`,
        sender_id: msg.sender?.id,
        recipient_id: msg.recipient?.id,
        event_type: msg.message ? 'message'
          : msg.postback ? 'postback'
          : msg.reaction ? 'reaction'
          : msg.delivery ? 'delivery'
          : msg.read ? 'read' : 'other',
        text: msg.message?.text || msg.postback?.payload || null,
        attachments: msg.message?.attachments || null,
        raw: msg,
        received_at: msg.timestamp ? new Date(Number(msg.timestamp)).toISOString() : new Date().toISOString(),
      });
    }
    // Facebook Page / Instagram comment/mention/feed
    for (const change of entry.changes || []) {
      events.push({
        channel: object,
        external_id: change.value?.comment_id || change.value?.media_id || `${entry.id}-${entry.time}-${change.field}`,
        event_type: change.field,
        text: change.value?.message || change.value?.text || null,
        raw: change,
        received_at: entry.time ? new Date(Number(entry.time) * 1000).toISOString() : new Date().toISOString(),
      });
    }
    // WhatsApp Cloud API
    if (object === 'whatsapp_business_account') {
      for (const change of entry.changes || []) {
        const v = change.value || {};
        for (const msg of v.messages || []) {
          events.push({
            channel: 'whatsapp',
            external_id: msg.id,
            sender_id: msg.from,
            recipient_id: v.metadata?.phone_number_id,
            event_type: msg.type, // text | image | audio | document | interactive | ...
            text: msg.text?.body || msg.button?.text || msg.interactive?.button_reply?.title || null,
            attachments: msg.image || msg.audio || msg.document || msg.video || null,
            raw: msg,
            received_at: msg.timestamp ? new Date(Number(msg.timestamp) * 1000).toISOString() : new Date().toISOString(),
          });
        }
        for (const status of v.statuses || []) {
          events.push({
            channel: 'whatsapp',
            external_id: status.id,
            sender_id: status.recipient_id,
            event_type: `status:${status.status}`, // sent | delivered | read | failed
            text: null,
            raw: status,
            received_at: status.timestamp ? new Date(Number(status.timestamp) * 1000).toISOString() : new Date().toISOString(),
          });
        }
      }
    }
  }
  return events;
}

export default async function handler(req, res) {
  // -----------------------------------------------------------------------
  // GET → Meta webhook verification handshake
  // -----------------------------------------------------------------------
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;
    if (mode === 'subscribe' && token && expected && token === expected) {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(String(challenge || ''));
    }
    return res.status(403).json({ error: 'verify token mismatch' });
  }

  // -----------------------------------------------------------------------
  // POST → real webhook events
  // -----------------------------------------------------------------------
  if (req.method === 'POST') {
    let raw;
    try {
      raw = await readRawBody(req);
    } catch {
      return res.status(400).json({ error: 'could not read body' });
    }

    const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;
    const sigOk = verifySignature(raw, req.headers['x-hub-signature-256'], appSecret);

    // Meta requires a fast 200 OK. We log and (best-effort) persist asynchronously.
    res.status(200).json({ received: true, verified: sigOk });

    if (!sigOk) {
      // Drop unsigned events — never write attacker-controlled data to DB
      console.warn('[meta-webhook] signature verification failed');
      return;
    }

    try {
      const payload = JSON.parse(raw.toString('utf8'));
      const events = flattenEvents(payload);
      if (events.length === 0) return;

      // Best-effort insert. If `messages` table doesn't exist yet, swallow.
      const { error } = await supabase.from('messages').insert(events);
      if (error && !/schema cache|does not exist|PGRST205/.test(error.message)) {
        console.error('[meta-webhook] supabase insert error:', error.message);
      }
    } catch (e) {
      console.error('[meta-webhook] processing error:', e.message);
    }
    return;
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
