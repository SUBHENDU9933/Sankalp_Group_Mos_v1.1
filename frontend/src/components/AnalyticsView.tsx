import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { api } from '../lib/api';

export default function AnalyticsView() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => { api.analytics.list(30).then(setData).catch(console.error); }, []);

  const grouped: Record<string, any> = {};
  for (const r of data) {
    grouped[r.date] = grouped[r.date] || { date: r.date };
    grouped[r.date][r.platform] = (grouped[r.date][r.platform] || 0) + Number(r.value);
  }
  const chart = Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));

  return (
    <div className="px-8 py-6 space-y-5" data-testid="analytics-view">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Intelligence</div>
        <h2 className="font-display text-2xl font-semibold mt-1">Analytics</h2>
      </div>

      <div className="card-elev p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Daily reach by platform</h3>
        <div className="h-[360px]">
          {chart.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={chart}>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip contentStyle={{ background:'#131B2B', border:'1px solid #1E2A42', borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="facebook" stackId="a" fill="#1877F2" radius={[6,6,0,0]} />
                <Bar dataKey="instagram" stackId="a" fill="#E4405F" />
                <Bar dataKey="google" stackId="a" fill="#F47B20" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-ink-400 text-sm">No analytics yet — analytics will appear after your first published posts.</div>
          )}
        </div>
      </div>
    </div>
  );
}
