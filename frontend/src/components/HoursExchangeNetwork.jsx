import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

// VIZ — member↔member hours-exchange network graph (inline SVG).
export default function HoursExchangeNetwork() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiFetch('/api/custom-views/hours-exchange-network')
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setErr(e.message || 'Failed to load network'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="card">Loading hours-exchange network…</div>;
  if (err) return <div className="card" style={{ color: '#b91c1c' }}>Error: {err}</div>;
  if (!data) return null;

  const { nodes = [], edges = [] } = data;
  const maxHours = Math.max(1, ...edges.map((e) => e.hours || 0));
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Hours-Exchange Network — Member ↔ Member</h3>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
        Window: {data.window} · {nodes.length} members · {edges.length} exchanges
      </div>
      <div style={{ overflow: 'auto' }}>
        <svg width={360} height={360} style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 6 }}>
          {edges.map((e, i) => {
            const a = byId[e.source];
            const b = byId[e.target];
            if (!a || !b) return null;
            const w = 1 + (e.hours / maxHours) * 5;
            return (
              <g key={i}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#2563eb"
                  strokeOpacity={0.45}
                  strokeWidth={w}
                />
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 2}
                  fontSize="9"
                  fill="#374151"
                  textAnchor="middle"
                >
                  {e.hours}h
                </text>
              </g>
            );
          })}
          {nodes.map((n, i) => (
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={12 + Math.min(10, (n.totalHours || 0) / 4)} fill={n.role === 'Steward' ? '#16a34a' : '#9333ea'} stroke="#fff" strokeWidth="2" />
              <text x={n.x} y={n.y + 28} fontSize="10" fill="#1f2937" textAnchor="middle">
                {n.name.split(' ')[0]}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 14, fontSize: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} /> Steward
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#9333ea', display: 'inline-block' }} /> Member
        </div>
        <div style={{ color: '#6b7280' }}>Edge thickness ∝ hours exchanged</div>
      </div>
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginTop: 12 }}>
        <thead><tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
          <th style={{ padding: 6 }}>Member</th><th style={{ padding: 6 }}>Role</th><th style={{ padding: 6 }}>Total hours</th>
        </tr></thead>
        <tbody>
          {nodes.map((n) => (
            <tr key={n.id} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: 6 }}>{n.name}</td>
              <td style={{ padding: 6 }}>{n.role}</td>
              <td style={{ padding: 6 }}>{(n.totalHours || 0).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
