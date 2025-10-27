import { useState } from 'react';
import { fetchOffByBarcode, fetchOffByName } from '../utils/off';
import { addDaysISO } from '../utils/shelfLife';

function genId() {
  try { if (window.crypto?.randomUUID) return window.crypto.randomUUID(); } catch {}
  return String(Date.now()) + '-' + Math.floor(Math.random() * 1e6);
}

export default function AddItemBar({ onAdd }) {
  const [mode, setMode] = useState('name'); // 'name' | 'barcode'
  const [text, setText] = useState('');
  const [days, setDays] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const value = (text || '').trim();
    if (!value) return;

    setLoading(true);
    setErr('');

    try {
      const base = { opened: false, storage: 'refrigerated', cooked: false };
      const data = mode === 'barcode'
        ? await fetchOffByBarcode(value, base)
        : await fetchOffByName(value, base);

      if ((data.category === 'unknown' || !data.category) && !days) {
        setErr('Unknown category. Please enter shelf-life days for this item.');
        setLoading(false);
        return;
      }
      const finalExpiryISO = days ? addDaysISO(Number(days)) : data.expiryISO;

      onAdd?.({
        id: genId(),
        qty: 1,
        name: data.name,
        category: data.category || 'unknown',
        expiryISO: finalExpiryISO,
        nova: data.nova || null,
        nutri: data.nutri || null,
        source: 'off'
      });

      setText('');
      setDays('');
    } catch (e2) {
      setErr(e2?.message || 'Failed to add item');
      console.error('AddItem error:', e2);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}
          style={{ display:'grid', gridTemplateColumns:'auto 1fr auto 120px auto', gap:8, alignItems:'center', margin:'12px 0' }}>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <strong>Input by:</strong>
        <label><input type="radio" name="mode" value="name" checked={mode==='name'} onChange={()=>setMode('name')} /> Name</label>
        <label><input type="radio" name="mode" value="barcode" checked={mode==='barcode'} onChange={()=>setMode('barcode')} /> Barcode</label>
      </div>

      <input
        placeholder={mode==='barcode' ? 'Enter barcode (e.g., 737628064502)' : 'Enter food name (e.g., milk)'}
        value={text}
        onChange={e=>setText(e.target.value)}
        style={{ padding:8 }}
      />

      <label style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ color:'#6b7280' }}>Days</span>
        <input type="number" min={1} value={days} onChange={e=>setDays(e.target.value)} placeholder="optional" style={{ width:80, padding:8 }} />
      </label>

      <button type="submit" disabled={loading} style={{ padding:'8px 12px' }}>
        {loading ? 'Adding…' : 'Add'}
      </button>

      {err ? <span style={{ color:'#c00' }}>Error: {err}</span> : null}
    </form>
  );
}
