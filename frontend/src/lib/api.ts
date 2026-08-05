// Centralised API client for Sankalp Marketing Hub
const RAW = import.meta.env.VITE_BACKEND_URL || '';
export const BACKEND_URL = (RAW || '').replace(/\/$/, '');

async function request<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    // Read the body ONCE as text, then try to parse as JSON.
    // (We cannot call .json() then .text() — the body stream can only be read once.)
    const raw = await res.text().catch(() => '');
    let detail: any = raw;
    try { detail = raw ? JSON.parse(raw) : ''; } catch { /* keep raw text */ }
    const msg = typeof detail === 'string'
      ? (detail || res.statusText)
      : (detail?.detail || detail?.error || detail?.message || JSON.stringify(detail));
    throw new Error(`${res.status} ${msg}`);
  }
  if (res.status === 204) return undefined as any;
  // Same single-read principle for the success path — avoids the bug if the
  // server (rare) returns a 2xx with an empty body.
  const text = await res.text();
  if (!text) return undefined as any;
  try { return JSON.parse(text) as T; } catch { return text as unknown as T; }
}

// All CRUD resources (posts/blogs/reviews/campaigns/integrations/media/analytics/
// messages/dashboard) are served by ONE consolidated function, api/data.js, kept
// to a single file so we stay under Vercel's Hobby-plan serverless function count
// limit. Vercel's dynamic bracket-file routing ([resource].js -> /api/:resource)
// was not resolving in this project, so we call it explicitly via ?resource=
// instead of relying on that path-based dynamic routing.
function dataPath(resource: string, query: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams({ resource, ...Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined) as any) });
  return `/api/data?${params.toString()}`;
}

export const api = {
  health: () => request('/api/health'),
  dashboard: () => request(dataPath('dashboard')),

  posts: {
    list: (status?: string) => request(dataPath('posts', { status })),
    create: (data: any) => request(dataPath('posts'), { method: 'POST', body: JSON.stringify(data) }),
    update: (data: any) => request(dataPath('posts'), { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => request(dataPath('posts'), { method: 'DELETE', body: JSON.stringify({ id }) }),
    publish: (id: number | string) => request('/api/publish', { method: 'POST', body: JSON.stringify({ id }) }),
  },
  blogs: {
    list: (status?: string) => request(dataPath('blogs', { status })),
    create: (data: any) => request(dataPath('blogs'), { method: 'POST', body: JSON.stringify(data) }),
    update: (data: any) => request(dataPath('blogs'), { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => request(dataPath('blogs'), { method: 'DELETE', body: JSON.stringify({ id }) }),
  },
  reviews: {
    list: () => request(dataPath('reviews')),
    update: (data: any) => request(dataPath('reviews'), { method: 'PUT', body: JSON.stringify(data) }),
  },
  campaigns: {
    list: () => request(dataPath('campaigns')),
    create: (data: any) => request(dataPath('campaigns'), { method: 'POST', body: JSON.stringify(data) }),
    update: (data: any) => request(dataPath('campaigns'), { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => request(dataPath('campaigns'), { method: 'DELETE', body: JSON.stringify({ id }) }),
  },
  integrations: {
    list: () => request(dataPath('integrations')),
    disconnect: (platform: string) => request('/api/auth/disconnect', { method: 'POST', body: JSON.stringify({ platform }) }),
  },
  messages: {
    list: (channel?: string) => request(dataPath('messages', { channel })),
    update: (data: any) => request(dataPath('messages'), { method: 'PUT', body: JSON.stringify(data) }),
  },
  media: {
    list: () => request(dataPath('media_library')),
  },
  media_library: {
    list: () => request(dataPath('media_library')),
    create: (data: any) => request(dataPath('media_library'), { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: number) => request(dataPath('media_library'), { method: 'DELETE', body: JSON.stringify({ id }) }),
  },
  analytics: {
    list: (days = 30, metric_type?: string) => request(dataPath('analytics', { days, metric_type })),
  },
  ai: {
    generate: (payload: { task: string; prompt: string; platform?: string; tone?: string; language?: string; context?: any }) =>
      request('/api/ai/generate', { method: 'POST', body: JSON.stringify(payload) }),
  },
};

export function oauthPopup(platform: string, onSuccess?: (data: any) => void) {
  const width = 600, height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  const url =
    platform === 'facebook' || platform === 'instagram'
      ? `${BACKEND_URL}/api/auth/facebook`
      : platform === 'threads'
        ? `${BACKEND_URL}/api/auth/threads`
        : platform === 'x' || platform === 'twitter'
          ? `${BACKEND_URL}/api/auth/x`
          : `${BACKEND_URL}/api/auth/google?platform=${platform}`;
  const popup = window.open(url, `${platform}-oauth`, `width=${width},height=${height},left=${left},top=${top}`);

  const handler = (e: MessageEvent) => {
    if (e.data?.type === 'oauth-success') {
      window.removeEventListener('message', handler);
      onSuccess?.(e.data);
    }
  };
  window.addEventListener('message', handler);
  const t = setInterval(() => {
    if (popup?.closed) { clearInterval(t); window.removeEventListener('message', handler); onSuccess?.({ closed: true }); }
  }, 500);
}
