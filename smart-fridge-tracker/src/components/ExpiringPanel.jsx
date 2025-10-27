import { daysLeft } from '../utils/shelfLife';

export default function ExpiringPanel({ items = [] }) {
  const soon = items.filter(it => daysLeft(it.expiryISO) <= 2);
  if (!soon.length)
    return <div style={{ color:'#777', padding:8, border:'1px dashed #bbb', borderRadius:8 }}>No items expiring soon.</div>;

  return (
    <div style={{ border:'1px dashed #bbb', borderRadius:8, padding:12 }}>
      <strong>⏰ Items expiring soon (≤ 2 days):</strong>
      <ul>
        {soon.map(it => (
          <li key={it.id}>{it.name} — expires in {daysLeft(it.expiryISO)} day(s)</li>
        ))}
      </ul>
    </div>
  );
}
