import React from 'react';
import type { FridgeItem } from '../types';
import { compositionByCategory as compositionStrict, wasteTrend } from '../stats';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line, ReferenceLine
} from 'recharts';

/** Fallback: looser grouping that counts anything with a name,
 *  assigns a readable category (or "Uncategorized"), and ignores status/expiry.
 */
function compositionByCategoryLoose(items: FridgeItem[]) {
  const map = new Map<string, number>();
  for (const it of items ?? []) {
    if (!it?.name) continue;
    const raw = (it as any).category ?? 'Uncategorized';
    const cat =
      typeof raw === 'string' && raw.trim() && raw !== 'unknown'
        ? raw
        : 'Uncategorized';
    map.set(cat, (map.get(cat) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
}

export default function StatsDashboard({ items }: { items: FridgeItem[] }) {
  console.log('✅ StatsDashboard mounted. Number of fridge items:', items?.length);

  // Strict composition from stats.ts (in-stock & not expired).
  const compStrict = compositionStrict(items);
  // If strict is empty, fall back to a looser grouping so bars still render.
  const comp = compStrict.length ? compStrict : compositionByCategoryLoose(items);

  // Waste trend (unchanged)
  const trend = wasteTrend(items, 10);
  const thisWeek = trend.at(-1);
  const lastWeek = trend.length >= 2 ? trend.at(-2) : undefined;
  const deltaWaste = lastWeek ? (thisWeek!.wasteRate - lastWeek.wasteRate) : 0;

  return (
    <div>
      {/* KPI: weekly waste rate */}
      <div className="section" style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
        <div className="text-sm" style={{ color: '#667085' }}>Waste Rate (This Week)</div>
        <div style={{ fontSize: 24, fontWeight: 600 }}>
          {((thisWeek?.wasteRate ?? 0) * 100).toFixed(0)}%
        </div>
        <div
          style={{
            fontSize: 12,
            color: deltaWaste > 0 ? '#dc2626' : deltaWaste < 0 ? '#16a34a' : '#6b7280'
          }}
        >
          {deltaWaste === 0 ? '—' : `${deltaWaste > 0 ? '↑' : '↓'}${Math.abs(deltaWaste * 100).toFixed(1)}% vs last week`}
        </div>
      </div>

      {/* Fridge composition */}
      <div className="section chart">
        <h3 className="chart-title">Fridge Composition (by Category)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart
            data={comp}
            margin={{ top: 8, right: 16, bottom: 32, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" tickMargin={8} interval={0} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend verticalAlign="bottom" height={24} wrapperStyle={{ paddingTop: 8 }} />
            {/* Ensure visible bars even for small counts */}
            <Bar dataKey="count" name="Count" barSize={40} />
          </BarChart>
        </ResponsiveContainer>

        {/* Optional hint when strict was empty */}
        {compStrict.length === 0 && comp.length > 0 && (
          <p style={{ textAlign: 'center', marginTop: 8, color: '#888' }}>
            Showing all items (including consumed/discarded) because no in-stock, non-expired items were found.
          </p>
        )}
      </div>

      {/* Waste rate trend */}
      <div className="section chart">
        <h3 className="chart-title">Waste Rate Trend (Past 10 Weeks)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart
            data={trend}
            margin={{ top: 8, right: 16, bottom: 32, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" tickMargin={8} />
            <YAxis domain={[0, 1]} tickFormatter={(v) => (v * 100) + '%' } />
            <Tooltip formatter={(v) => (Number(v) * 100).toFixed(1) + '%'} />
            <Legend verticalAlign="bottom" height={24} wrapperStyle={{ paddingTop: 8 }} />
            <ReferenceLine y={0.15} strokeDasharray="4 4" label="15%" />
            <Line type="monotone" dataKey="wasteRate" name="Waste Rate" dot />
          </LineChart>
        </ResponsiveContainer>

        {trend.every(t => t.wasteRate === 0) && (
          <p style={{ textAlign: 'center', marginTop: 8, color: '#888' }}>
            No waste data yet — start tracking your fridge activity!
          </p>
        )}
      </div>
    </div>
  );
}
