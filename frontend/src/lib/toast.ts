// Toast helper — minimal, dependency-free
import { useState, useEffect, useCallback } from 'react';

type Toast = { id: number; title: string; description?: string; tone?: 'success' | 'error' | 'info' };
let listeners: ((t: Toast) => void)[] = [];

export function pushToast(t: Omit<Toast, 'id'>) {
  listeners.forEach(l => l({ id: Date.now() + Math.random(), ...t }));
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const l = (t: Toast) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(p => p.id !== t.id)), 4200);
    };
    listeners.push(l);
    return () => { listeners = listeners.filter(x => x !== l); };
  }, []);
  const dismiss = useCallback((id: number) => setToasts(prev => prev.filter(p => p.id !== id)), []);
  return { toasts, dismiss };
}
