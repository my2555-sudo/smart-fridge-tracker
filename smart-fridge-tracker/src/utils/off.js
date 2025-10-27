// src/utils/off.js
import { mapOffToCategory, estimateShelfLifeDays, addDaysISO } from './shelfLife.js';

function norm(s){ return String(s || '').toLowerCase(); }
function includesAny(s, arr){ s = norm(s); return arr.some(k => s.includes(norm(k))); }

// 轻量词干：tomatoes->tomato, strawberries->strawberry
function stem(w){
  w = norm(w).trim();
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('es'))  return w.slice(0, -2);
  if (w.endsWith('s'))   return w.slice(0, -1);
  return w;
}

// 针对常见“原料”的类目/惩罚提示
function intentHints(core){
  const h = {
    egg: { mustLike: ['en:eggs'],          avoid: ['noodle','pasta','mayonnaise','sauce','dessert'] },
    strawberry: { mustLike: ['en:strawberries'], avoid: ['jam','preserve','yogurt','dessert','drink','juice'] },
    tomato: { mustLike: ['en:tomatoes'],   avoid: ['sauce','ketchup','pasta','soup','juice'] }
  };
  return h[core] || { mustLike: [], avoid: [] };
}

/** ---------- 条码查询（唯一键，最准确） ---------- */
export async function fetchOffByBarcode(barcode, opts = {}) {
  const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OFF barcode request failed');
  const json = await res.json();
  const p = (json && json.product) ? json.product : {};
  const tags = Array.isArray(p.categories_tags) ? p.categories_tags : [];
  const baseCat = mapOffToCategory(tags);
  const days = estimateShelfLifeDays({ baseCat, tags, ...opts });
  return {
    name: p.product_name || p.generic_name || 'Unknown product',
    category: baseCat || 'unknown',
    expiryISO: addDaysISO(days),
    nova: p.nova_group || null,
    nutri: p.nutriscore_grade || null,
    source: 'off'
  };
}

/** ---------- 从候选里挑“最像原料”的一个（无 cosine） ---------- */
function pickBestProduct(products, query){
  const q = norm(query);
  const tokens = q.split(/\s+/).filter(Boolean);
  const core = stem(tokens[0] || '');
  const hints = intentHints(core);

  let best = null, bestScore = -1;

  for (const p of products) {
    const pname  = p.product_name || p.generic_name || '';
    const brands = (p.brands || '').split(',').map(norm);
    const tags   = Array.isArray(p.categories_tags) ? p.categories_tags.map(norm) : [];
    const nova   = Number(p.nova_group || 0);

    let score = 0;

    // 1) 名称强匹配
    const nameL = norm(pname);
    if (nameL === core) score += 14;
    if (nameL.startsWith(core + ' ')) score += 10;
    if (includesAny(nameL, [q])) score += 6;
    if (includesAny(brands.join(' '), [q, tokens.join('')])) score += 3;

    // 2) 期望类目（如 en:eggs / en:tomatoes / en:strawberries）
    if (hints.mustLike.length && tags.some(t => hints.mustLike.some(m => t.includes(m)))) score += 10;

    // 3) 惩罚加工形态
    const badWords = ['jam','sauce','ketchup','preserve','noodle','pasta','juice','drink','dessert','yogurt','spread','cookie','cereal','candy','soup'];
    if (includesAny([nameL, tags.join(' ')].join(' '), [...badWords, ...hints.avoid])) score -= 8;

    // 4) NOVA：优先 1/2，轻罚 3，重罚 4
    if (nova === 1) score += 8;
    else if (nova === 2) score += 4;
    else if (nova === 3) score -= 2;
    else if (nova >= 4) score -= 6;

    if (score > bestScore) { bestScore = score; best = p; }
  }

  return best || products[0];
}

/** ---------- 名称查询（多取→择优） ---------- */
export async function fetchOffByName(query, opts = {}) {
  const url =
    'https://world.openfoodfacts.org/cgi/search.pl?search_terms=' +
    encodeURIComponent(query) +
    '&search_simple=1&action=process&json=1&page_size=30';
  const res = await fetch(url);
  if (!res.ok) throw new Error('OFF name request failed');
  const json = await res.json();
  const list = (json && Array.isArray(json.products)) ? json.products : [];
  if (!list.length) throw new Error('No matching product');

  const p = pickBestProduct(list, query);
  const tags = Array.isArray(p.categories_tags) ? p.categories_tags : [];
  const baseCat = mapOffToCategory(tags);
  const days = estimateShelfLifeDays({ baseCat, tags, ...opts });

  // helper (top of file, once)
const toTitleCase = s =>
  String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

return {
  // ✅ Always use what the user typed (Name mode)
  name: toTitleCase(query),

  // (optional) keep OFF’s product title as metadata for later use/display
  offTitle: p.product_name_en || p.product_name || null,

  category: baseCat || 'unknown',
  expiryISO: addDaysISO(days),
  nova: p.nova_group ?? null,
  nutri: p.nutriscore_grade ?? null,
  source: 'off'
  };

}
