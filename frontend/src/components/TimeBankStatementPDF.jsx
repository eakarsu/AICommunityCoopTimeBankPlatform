import React, { useState } from 'react';
import { apiFetch } from '../api.js';

// NON-VIZ — Generates a PDF-shaped time-bank statement for a member.
export default function TimeBankStatementPDF() {
  const [member, setMember] = useState('Sofia Martinez');
  const [days, setDays] = useState(30);
  const [doc, setDoc] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function generate(e) {
    e.preventDefault();
    setErr(''); setDoc(null); setBusy(true);
    try {
      const qs = `?member=${encodeURIComponent(member)}&days=${encodeURIComponent(days)}`;
      const d = await apiFetch(`/api/custom-views/time-bank-statement-pdf${qs}`);
      setDoc(d);
    } catch (e) {
      setErr(e.message || 'Failed to generate statement');
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!doc) return;
    const blob = new Blob([doc.body], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Time Bank Statement (PDF)</h3>
      <form onSubmit={generate} style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
        <div className="form-row" style={{ flex: '1 1 220px', marginBottom: 0 }}>
          <label>Member</label>
          <input value={member} onChange={(e) => setMember(e.target.value)} placeholder="Member full name" />
        </div>
        <div className="form-row" style={{ width: 120, marginBottom: 0 }}>
          <label>Period (days)</label>
          <input type="number" value={days} min="7" max="365" onChange={(e) => setDays(e.target.value)} />
        </div>
        <button className="primary" disabled={busy}>{busy ? 'Generating…' : 'Generate Statement'}</button>
      </form>
      {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}
      {doc && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 14, fontSize: 13, color: '#374151', marginBottom: 8, flexWrap: 'wrap' }}>
            <div><strong>File:</strong> {doc.filename}</div>
            <div><strong>Pages:</strong> {doc.pages}</div>
            <div><strong>Size:</strong> {doc.size_bytes} B</div>
            <div><strong>Tx:</strong> {doc.transactions_count}</div>
            <div><strong>Earned:</strong> {doc.summary?.earned}</div>
            <div><strong>Spent:</strong> {doc.summary?.spent}</div>
            <div><strong>Balance:</strong> {doc.summary?.balance}</div>
            <button className="primary" style={{ padding: '4px 10px' }} onClick={download}>Download</button>
          </div>
          <pre className="result-box">{doc.body}</pre>
        </div>
      )}
    </div>
  );
}
