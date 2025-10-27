import { useState } from 'react';
import { daysLeft } from '../utils/shelfLife';

const NUTRI_HINT =
  'Nutri-Score: overall nutrition grade from A (best) to E (worst), based on positives (fruit/veg, fibre, protein) and negatives (calories, sugar, sat fat, salt).';
const NOVA_HINT =
  'NOVA processing group: 1=unprocessed/minimally, 2=cooking ingredients, 3=processed, 4=ultra-processed.';

export default function FridgeList({ items = [], onRemove, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [tmpDate, setTmpDate] = useState('');

  // —— 辅助：追加一条历史事件 —— //
  function withEvent(item, type) {
    const now = new Date().toISOString();
    const nextHistory = Array.isArray(item.history) ? item.history.slice() : [];
    nextHistory.push({ type, at: now }); // type: 'consumed' | 'discarded'
    return nextHistory;
  }

  // —— 吃掉 —— //
  function handleConsume(item) {
    const patch = {
      status: 'out',
      outReason: 'consumed',
      history: withEvent(item, 'consumed'),
    };
    onUpdate?.(item.id, patch);
  }

  // —— 丢弃 —— //
  function handleDiscard(item) {
    const patch = {
      status: 'out',
      outReason: 'discarded',
      history: withEvent(item, 'discarded'),
    };
    onUpdate?.(item.id, patch);
  }

  const sorted = [...items].sort((a, b) => daysLeft(a.expiryISO) - daysLeft(b.expiryISO));

  return (
    <div>
      {sorted.map(it => {
        const isEditing = editingId === it.id;
        const isOut = it.status === 'out';

        return (
          <div
            key={it.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 12,
              padding: 12,
              margin: '8px 0',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 8,
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, display:'flex', alignItems:'center', gap:8 }}>
                {it.name}
                {isOut && (
                  <span
                    style={{
                      fontSize: 12,
                      color: it.outReason === 'discarded' ? '#b42318' : '#155724',
                      background: it.outReason === 'discarded' ? '#fdeaea' : '#e7f6ea',
                      borderRadius: 6,
                      padding: '2px 6px'
                    }}
                    title={it.outReason === 'discarded' ? '已丢弃' : '已消耗'}
                  >
                    {it.outReason === 'discarded' ? 'Discarded' : 'Consumed'}
                  </span>
                )}
              </div>

              {!isEditing ? (
                <div style={{ color: '#555' }}>
                  Expiry: {it.expiryISO}{' '}
                  <span style={{ fontSize: 12, color: '#777' }}>
                    (in {daysLeft(it.expiryISO)} days)
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="date"
                    value={tmpDate || it.expiryISO}
                    onChange={e => setTmpDate(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (tmpDate) onUpdate?.(it.id, { expiryISO: tmpDate });
                      setEditingId(null);
                      setTmpDate('');
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setTmpDate('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap:'wrap' }}>
                {!isEditing && <button onClick={() => { setEditingId(it.id); setTmpDate(it.expiryISO); }}>Edit</button>}
                <button onClick={() => onRemove?.(it.id)}>Delete</button>

                {/* 仅对还在库的条目显示“吃掉/丢弃” */}
                {!isOut && (
                  <>
                    <button onClick={() => handleConsume(it)}>Consume</button>
                    <button onClick={() => handleDiscard(it)}>Discard</button>
                  </>
                )}
              </div>
            </div>

            <div style={{ justifySelf: 'end', display: 'flex', gap: 6 }}>
              {it.nutri && (
                <span
                  title={NUTRI_HINT}
                  style={{
                    background: '#f5f5f5',
                    padding: '2px 6px',
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: 'help'
                  }}
                >
                  Nutri {String(it.nutri).toUpperCase()}
                </span>
              )}
              {it.nova && (
                <span
                  title={NOVA_HINT}
                  style={{
                    background: '#f5f5f5',
                    padding: '2px 6px',
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: 'help'
                  }}
                >
                  NOVA {it.nova}
                </span>
              )}
            </div>
          </div>
        );
      })}
      {!sorted.length && <div style={{ color: '#777' }}>No food items yet</div>}
    </div>
  );
}
