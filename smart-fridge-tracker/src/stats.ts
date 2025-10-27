import type { FridgeItem } from './types';

// —— 过期判定（没有 expireAt 视为不过期）——
export function isExpired(it: FridgeItem, now = new Date()) {
  if (!it.expireAt) return false;
  return now.getTime() > new Date(it.expireAt).getTime();
}

// —— 构成：当前“在库 & 未过期”按分类计数 —— //
export function compositionByCategory(items: FridgeItem[]) {
  const now = new Date();
  const rows = items.filter(it => it.status === 'in' && !isExpired(it, now));
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.category, (map.get(r.category) ?? 0) + 1);
  return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
}

// —— 最近 n 周的时间桶（周一到周日）——
function weekBuckets(nWeeks: number) {
  const now = new Date();
  // 令 weekStart 为本周周一 00:00
  const day = now.getDay(); // 0=周日
  const diffToMon = (day + 6) % 7; // 周一距今天的天数
  const thisMon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMon);
  thisMon.setHours(0,0,0,0);

  const buckets: {label: string; start: Date; end: Date}[] = [];
  for (let i = nWeeks - 1; i >= 0; i--) {
    const start = new Date(thisMon);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7); // [start, end)
    const label = i === 0 ? 'This Week' : `W-${nWeeks - i}`;
    buckets.push({ label, start, end });
  }
  return buckets;
}

// —— 浪费率趋势 ——
// waste_rate_week = 丢弃数 / (消耗数 + 丢弃数)，分母为 0 则记 0
export function wasteTrend(items: FridgeItem[], nWeeks = 10) {
  const buckets = weekBuckets(nWeeks);
  return buckets.map(b => {
    let consumed = 0, discarded = 0;
    for (const it of items) {
      const evs = it.history ?? [];
      for (const ev of evs) {
        if (ev.type !== 'consumed' && ev.type !== 'discarded') continue;
        const t = new Date(ev.at).getTime();
        if (t >= b.start.getTime() && t < b.end.getTime()) {
          if (ev.type === 'consumed') consumed += 1;
          else discarded += 1;
        }
      }
    }
    const total = consumed + discarded;
    const rate = total === 0 ? 0 : discarded / total;
    return {
      week: b.label,
      consumed,
      discarded,
      total,
      wasteRate: Number(rate.toFixed(3))
    };
  });
}
