import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

// VIZ — member x service activity heatmap (hours/cell).
export default function MemberActivityHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiFetch('/api/custom-views/member-activity-heatmap')
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setErr(e.message || 'Failed to load heatmap'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="card">Loading member activity heatmap…</div>;
  if (err) return <div className="card" style={{ color: '#b91c1c' }}>Error: {err}</div>;
  if (!data) return null;

  const { members, services, matrix } = data;
  const colorFor = (v) => {
    if (v >= 9) return '#1d4ed8';
    if (v >= 5) return '#2563eb';
    if (v >= 1) return '#93c5fd';
    return '#f3f4f6';
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Member × Service Activity Heatmap ({data.unit})</h3>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
        Window: {data.window} · {members.length} members × {services.length} services
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ padding: 6, background: '#f3f4f6', border: '1px solid #e5e7eb' }}>Member \ Service</th>
              {services.map((s) => (
                <th key={s} style={{ padding: 6, background: '#f3f4f6', border: '1px solid #e5e7eb' }}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m, mi) => (
              <tr key={mi}>
                <td style={{ padding: 6, fontWeight: 600, background: '#fafafa', border: '1px solid #e5e7eb' }}>{m}</td>
                {services.map((s, si) => {
                  const v = matrix[mi][si];
                  return (
                    <td
                      key={si}
                      title={`${m} · ${s}: ${v}h`}
                      style={{
                        padding: 8, textAlign: 'center', minWidth: 60,
                        color: v >= 5 ? '#fff' : '#1f2937',
                        background: colorFor(v),
                        border: '1px solid #fff',
                      }}
                    >
                      {v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, flexWrap: 'wrap' }}>
        {(data.legend || []).map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, background: colorFor(l.min + 1), borderRadius: 3 }} />
            {l.label} (≥{l.min}h)
          </div>
        ))}
      </div>
    </div>
  );
}
