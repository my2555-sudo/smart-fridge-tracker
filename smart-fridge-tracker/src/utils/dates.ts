// src/utils/dates.ts
export function startOfDay(d: Date) {
  const t = new Date(d);
  t.setHours(0,0,0,0);
  return t;
}

export function daysToExpiry(expireISO?: string) {
  if (!expireISO) return Infinity;
  const today = startOfDay(new Date());
  const exp = startOfDay(new Date(expireISO));
  return Math.ceil((exp.getTime() - today.getTime()) / 86400000);
}

export function expiryLabel(expireISO?: string) {
  const d = daysToExpiry(expireISO);
  if (d === Infinity) return 'no expiry';
  if (d > 1)  return `in ${d} days`;
  if (d === 1) return 'in 1 day';
  if (d === 0) return 'today';
  const a = Math.abs(d);
  return a === 1 ? 'expired 1 day ago' : `expired ${a} days ago`;
}
