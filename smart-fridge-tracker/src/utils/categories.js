// 拉取 OFF 全量分类（体量较大，建议缓存）
export async function fetchOffCategories() {
  const url = 'https://world.openfoodfacts.org/categories.json';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch OFF categories');
  const json = await res.json();
  // OFF 返回形如 { tags: [ { id, name, products, url, ... } ] }
  const tags = Array.isArray(json.tags) ? json.tags : [];
  // 仅保留常用字段，按产品数排序，便于选择
  const categories = tags
    .map(t => ({ id: t.id, name: t.name, products: t.products || 0 }))
    .sort((a, b) => (b.products - a.products));

  try { localStorage.setItem('offCategories', JSON.stringify(categories)); } catch {}
  return categories;
}

export function loadCachedCategories() {
  try { return JSON.parse(localStorage.getItem('offCategories') || '[]'); } catch { return []; }
}
