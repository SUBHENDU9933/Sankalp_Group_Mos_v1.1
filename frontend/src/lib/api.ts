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
    let detail: any = undefined;
    try { detail = await res.json(); } catch { detail = await res.text(); }
    const msg = typeof detail === 'string' ? detail : (detail?.detail || JSON.stringify(detail));
    throw new Error(`${res.status} ${msg}`);
  }
  if (res.status === 204) return undefined as any;
  return res.json();
}

export const api = {
  health: () => request('/api/health'),
  dashboard: () => request('/api/dashboard'),

  posts: {
    list: (status?: string) => request(`/api/posts${status ? `?status=${status}` : ''}`),
    create: (data: any) => request('/api/posts', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: any) => request('/api/posts', { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => request('/api/posts', { method: 'DELETE', body: JSON.stringify({ id }) }),
    publish: (id: number | string) => request('/api/publish', { method: 'POST', body: JSON.stringify({ id }) }),
  },
  blogs: {
    list: (status?: string) => request(`/api/blogs${status ? `?status=${status}` : ''}`),
    create: (data: any) => request('/api/blogs', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: any) => request('/api/blogs', { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => request('/api/blogs', { method: 'DELETE', body: JSON.stringify({ id }) }),
  },
  reviews: {
    list: () => request('/api/reviews'),
    update: (data: any) => request('/api/reviews', { method: 'PUT', body: JSON.stringify(data) }),
  },
  campaigns: {
    list: () => request('/api/campaigns'),
    create: (data: any) => request('/api/campaigns', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: any) => request('/api/campaigns', { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => request('/api/campaigns', { method: 'DELETE', body: JSON.stringify({ id }) }),
  },
  integrations: {
    list: () => request('/api/integrations'),
    disconnect: (platform: string) => request('/api/auth/disconnect', { method: 'POST', body: JSON.stringify({ platform }) }),
  },
  media: {
    list: () => request('/api/media_library'),
  },
  media_library: {
    list: () => request('/api/media_library'),
    create: (data: any) => request('/api/media_library', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: number) => request('/api/media_library', { method: 'DELETE', body: JSON.stringify({ id }) }),
  },
  analytics: {
    list: (days = 30, metric_type?: string) => request(`/api/analytics?days=${days}${metric_type ? `&metric_type=${metric_type}` : ''}`),
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
  const url = platform === 'facebook' || platform === 'instagram'
    ? `${BACKEND_URL}/api/auth/facebook`
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
