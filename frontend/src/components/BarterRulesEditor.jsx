import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

// NON-VIZ — CRUD editor for barter / exchange rules.
const EMPTY = {
  service_category: '',
  rule_type: 'min_hours',
  constraint_value: '',
  active: true,
  description: '',
};

export default function BarterRulesEditor() {
  const [rules, setRules] = useState([]);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState('');
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiFetch('/api/custom-views/barter-rules')
      .then((d) => { setRules(d.rules || []); setTypes(d.valid_rule_types || []); })
      .catch((e) => setErr(e.message || 'Failed to load rules'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setDetails([]);
    try {
      const path = editingId ? `/api/custom-views/barter-rules/${editingId}` : '/api/custom-views/barter-rules';
      await apiFetch(path, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      setForm(EMPTY); setEditingId(null); load();
    } catch (e) {
      try {
        const parsed = JSON.parse(e.message);
        setErr(parsed.error || 'Save failed');
        setDetails(parsed.details || []);
      } catch {
        setErr(e.message || 'Save failed');
      }
    }
  };

  const edit = (r) => {
    setEditingId(r.id);
    setForm({
      service_category: r.service_category || '',
      rule_type: r.rule_type || 'min_hours',
      constraint_value: r.constraint_value || '',
      active: r.active !== false,
      description: r.description || '',
    });
  };

  const del = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await apiFetch(`/api/custom-views/barter-rules/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setErr(e.message || 'Delete failed');
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Barter / Exchange Rules Editor</h3>

      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 14, alignItems: 'end' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ fontSize: 11, color: '#555' }}>Service category</label>
          <input value={form.service_category} onChange={(e) => setForm({ ...form, service_category: e.target.value })} placeholder="e.g. Childcare" />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#555' }}>Rule type</label>
          <select value={form.rule_type} onChange={(e) => setForm({ ...form, rule_type: e.target.value })}>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#555' }}>Constraint value</label>
          <input value={form.constraint_value} onChange={(e) => setForm({ ...form, constraint_value: e.target.value })} placeholder="e.g. 1 or 1:1" />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#555' }}>Active</label>
          <div>
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> active
          </div>
        </div>
        <div>
          <button type="submit" className="primary" style={{ padding: '6px 12px' }}>{editingId ? 'Update' : 'Add'}</button>
          {editingId && (
            <button type="button" className="primary" style={{ marginLeft: 6, background: '#6b7280', padding: '6px 12px' }} onClick={() => { setEditingId(null); setForm(EMPTY); }}>Cancel</button>
          )}
        </div>
        <div style={{ gridColumn: 'span 6' }}>
          <label style={{ fontSize: 11, color: '#555' }}>Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="why this rule" />
        </div>
      </form>

      {err && (
        <div className="error">
          {err}
          {details.length > 0 && <ul style={{ margin: '4px 0 0 18px' }}>{details.map((d, i) => <li key={i}>{d}</li>)}</ul>}
        </div>
      )}

      {loading ? (
        <div>Loading rules…</div>
      ) : (
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
              <th style={{ padding: 6 }}>Service</th>
              <th style={{ padding: 6 }}>Type</th>
              <th style={{ padding: 6 }}>Value</th>
              <th style={{ padding: 6 }}>Active</th>
              <th style={{ padding: 6 }}>Description</th>
              <th style={{ padding: 6 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: 6 }}>{r.service_category}</td>
                <td style={{ padding: 6 }}>{r.rule_type}</td>
                <td style={{ padding: 6 }}>{r.constraint_value}</td>
                <td style={{ padding: 6 }}>{r.active ? 'yes' : 'no'}</td>
                <td style={{ padding: 6 }}>{r.description}</td>
                <td style={{ padding: 6 }}>
                  <button onClick={() => edit(r)} style={{ marginRight: 6 }}>Edit</button>
                  <button onClick={() => del(r.id)} style={{ background: '#ef4444', color: '#fff', border: 0, padding: '4px 8px', borderRadius: 4 }}>Delete</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 12, color: '#6b7280' }}>No rules defined yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
