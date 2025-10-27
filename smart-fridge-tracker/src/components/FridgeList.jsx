import { useState } from 'react';
import { daysLeft } from '../utils/shelfLife';

const NUTRI_HINT =
  'Nutri-Score: overall nutrition grade from A (best) to E (worst), based on positives (fruit/veg, fibre, protein) and negatives (calories, sugar, sat fat, salt).';
const NOVA_HINT =
  'NOVA processing group: 1=unprocessed/minimally, 2=cooking ingredients, 3=processed, 4=ultra-processed.';

export default function FridgeList({ items = [], onRemove, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [tmpDate, setTmpDate] = useState('');

  const sorted = [...items].sort((a, b) => daysLeft(a.expiryISO) - daysLeft(b.expiryISO));

  return (
    <div>
      {sorted.map(it => {
        const isEditing = editingId === it.id;
        return (
          <div key={it.id}
               style={{ border:'1px solid #ddd', borderRadius:12, padding:12, margin:'8px 0',
                        display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:18 }}>{it.name}</div>

              {!isEditing ? (
                <div style={{ color:'#555' }}>
                  Expiry: {it.expiryISO} <span style={{ fontSize:12, color:'#777' }}>(in {daysLeft(it.expiryISO)} days)</span>
                </div>
              ) : (
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input type="date" value={tmpDate || it.expiryISO} onChange={e => setTmpDate(e.target.value)} />
                  <button onClick={() => { if (tmpDate) onUpdate?.(it.id, { expiryISO: tmpDate }); setEditingId(null); setTmpDate(''); }}>
                    Save
                  </button>
                  <button onClick={() => { setEditingId(null); setTmpDate(''); }}>Cancel</button>
                </div>
              )}

              <div style={{ display:'flex', gap:8, marginTop:6 }}>
                {!isEditing && <button onClick={() => { setEditingId(it.id); setTmpDate(it.expiryISO); }}>Edit</button>}
                <button onClick={() => onRemove?.(it.id)}>Delete</button>
              </div>
            </div>

            <div style={{ justifySelf:'end', display:'flex', gap:6 }}>
              {it.nutri && (
                <span title={NUTRI_HINT}
                      style={{ background:'#f5f5f5', padding:'2px 6px', borderRadius:6, fontSize:12, cursor:'help' }}>
                  Nutri {String(it.nutri).toUpperCase()}
                </span>
              )}
              {it.nova && (
                <span title={NOVA_HINT}
                      style={{ background:'#f5f5f5', padding:'2px 6px', borderRadius:6, fontSize:12, cursor:'help' }}>
                  NOVA {it.nova}
                </span>
              )}
            </div>
          </div>
        );
      })}
      {!sorted.length && <div style={{ color:'#777' }}>No food items yet</div>}
    </div>
  );
}
