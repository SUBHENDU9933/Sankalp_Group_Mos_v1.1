import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Image as ImageIcon } from 'lucide-react';

export default function MediaView() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { api.media.list().then(setItems).catch(console.error); }, []);

  return (
    <div className="px-8 py-6" data-testid="media-view">
      <div className="mb-5">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Assets</div>
        <h2 className="font-display text-2xl font-semibold mt-1">Media Library</h2>
      </div>
      {items.length === 0 ? (
        <div className="card-elev p-12 text-center text-ink-400 flex flex-col items-center gap-3">
          <ImageIcon className="size-10 text-ink-500" />
          Upload media via the composer. Logos, banners, photos and videos will show up here.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((m: any) => (
            <div key={m.id} className="aspect-square rounded-xl bg-white/5 border border-white/8 overflow-hidden">
              <img src={m.url} alt={m.filename} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
