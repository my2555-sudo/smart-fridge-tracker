import { useEffect, useMemo, useState } from 'react';
import { fetchOffCategories, loadCachedCategories } from '../utils/categories';
import { loadShelfLifeOverrides, saveShelfLifeOverrides } from '../utils/shelfLife';

export default function CategoryShelfLifeEditor() {
  const [cats, setCats] = useState(loadCachedCategories());
  const [q, setQ] = useState('');
  const [overrides, setOverrides] = useState(loadShelfLifeOverrides());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cats.length) return;
    setLoading(true);
    fetchOffCategories().then(setCats).catch(()=>{}).finally(()=>setLoading(false));
  }, []); // 初次加载拉取并缓存

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return cats.slice(0, 30); // 默认显示前 30 个热门分类
    return cats.filter(c => (c.name || c.id || '').toLowerCase().includes(kw)).slice(0, 50);
  }, [q, cats]);

  function updateDays(key, days) {
    const n = Math.max(1, Number(days || 1));
    const next = { ...overrides, [key]: n };
    setOverrides(next);
    saveShelfLifeOverrides(next);
  }

  return (
    <div style={{border:'1px solid #e5e7eb', borderRadius:12, padding:12, margin:'12px 0'}}>
      <h3 style={{margin:'0 0 8px'}}>Category shelf-life (days)</h3>
      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
        <input
          placeholder="Search OFF categories (e.g., dairy, yogurt, broccoli)"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          style={{flex:1, padding:8}}
        />
        {loading ? <span>Loading…</span> : <span style={{color:'#6b7280'}}>{cats.length} cats</span>}
      </div>

      <div style={{maxHeight:260, overflow:'auto', border:'1px solid #eee', borderRadius:8}}>
        {filtered.map(c => {
          const key = c.id || c.name;          // 用 OFF 原始 id 作为键
          const val = overrides[key] || '';
          return (
            <div key={key} style={{display:'grid', gridTemplateColumns:'2fr 1fr 80px', gap:8, padding:'8px 10px', borderBottom:'1px solid #f3f4f6'}}>
              <div title={key}><strong>{c.name || key}</strong> <span style={{color:'#9ca3af'}}>({c.products})</span></div>
              <input
                type="number"
                min={1}
                placeholder="days"
                value={val}
                onChange={(e)=>updateDays(key, e.target.value)}
                style={{padding:6}}
              />
              <div style={{color:'#6b7280', fontSize:12}}>{key}</div>
            </div>
          );
        })}
        {!filtered.length && <div style={{padding:12, color:'#6b7280'}}>No category matched.</div>}
      </div>

      <p style={{marginTop:8, color:'#6b7280', fontSize:12}}>
        Tip: values here override defaults. If a product’s OFF tag is “en:dairies”, set that key to override milk/yogurt etc.
      </p>
    </div>
  );
}
