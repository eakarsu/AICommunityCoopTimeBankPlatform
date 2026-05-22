import React, { useState } from 'react';

export default function ReciprocityBalance() {
  const [form, setForm] = useState({ hoursGiven: 4, hoursReceived: 19, inactiveDays: 35, openRequests: 4 });
  const [result, setResult] = useState(null);
  const submit = async () => {
    const response = await fetch('/api/reciprocity-balance/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      body: JSON.stringify(form),
    });
    setResult(await response.json());
  };
  return (
    <div className="tool-page">
      <h2>Reciprocity Balance</h2>
      {Object.entries(form).map(([key, value]) => (
        <label key={key}>{key.replace(/([A-Z])/g, ' $1')}<input type="number" value={value} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} /></label>
      ))}
      <button onClick={submit}>Score balance</button>
      {result && <section><h3>{result.level.toUpperCase()} · {result.score}/100</h3><ul>{result.actions.map((action) => <li key={action}>{action}</li>)}</ul></section>}
    </div>
  );
}
