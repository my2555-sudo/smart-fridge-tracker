// src/utils/shelfLife.js
export const DEFAULT_SHELF_LIFE = {
  dairy: 7, cooked: 4, leafy_veg: 4, cruciferous: 6,
  egg: 14, meat_raw: 2, root_veg: 21, unknown: 5
};

export function loadShelfLifeOverrides() {
  try { return JSON.parse(localStorage.getItem('shelfLifeOverrides') || '{}'); }
  catch { return {}; }
}
export function saveShelfLifeOverrides(map) {
  try { localStorage.setItem('shelfLifeOverrides', JSON.stringify(map)); } catch {}
}

export function mapOffToCategory(tags = []) {
  const t = tags.map((s) => String(s).toLowerCase());
  if (t.some((x) => x.includes('dair'))) return 'dairy';
  if (t.some((x) => x.includes('cooked'))) return 'cooked';
  if (t.some((x) => x.includes('leaf') || x.includes('lettuce') || x.includes('spinach'))) return 'leafy_veg';
  if (t.some((x) => x.includes('broccoli') || x.includes('brassic'))) return 'cruciferous';
  if (t.some((x) => x.includes('egg'))) return 'egg';
  if (t.some((x) => x.includes('meat'))) return 'meat_raw';
  if (t.some((x) => x.includes('root') || x.includes('carrot') || x.includes('potato'))) return 'root_veg';
  // fallback：没命中内置，就把第一个 OFF tag 当作基类键
  return (tags[0] || 'unknown');
}

// ⬇️ 这里新增了 tags 支持 & “按 OFF tag 覆盖优先”
export function estimateShelfLifeDays({
  baseCat,
  tags = [],                   // ← 新增：OFF 原始分类数组，如 ['en:milks','en:dairies',...]
  opened = false,
  storage = 'refrigerated',
  cooked = false
}) {
  const overrides = loadShelfLifeOverrides();
  let days;

  // 1) 先看是否命中你在面板里设置的 OFF 原始 tag（大小写统一为小写）
  for (const raw of tags) {
    const key = String(raw).toLowerCase();
    if (overrides[key]) { days = Number(overrides[key]); break; }
  }

  // 2) 没命中 tag 才退回到：覆盖表里的内部别名 / 默认表
  if (days == null) {
    const baseMap = { ...DEFAULT_SHELF_LIFE, ...overrides };
    days = baseMap[baseCat] ?? baseMap.unknown ?? 5;
  }

  // 3) 修正因子
  if (cooked) days = 4;
  if (opened) days = Math.max(1, Math.round(days * 0.6));
  if (storage === 'frozen') days = Math.round(days * 3);

  return days;
}

export function addDaysISO(n) {
  const d = new Date();
  d.setDate(d.getDate() + Number(n || 0));
  return d.toISOString().slice(0, 10);
}
export function daysLeft(iso) {
  const today = new Date();
  const d = new Date(iso);
  return Math.ceil((d - today) / 86400000);
}
