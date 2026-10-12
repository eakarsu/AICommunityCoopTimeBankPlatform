import React, { useMemo, useState } from 'react';

const initialItems = [
  { id: 1, owner: 'Steward', priority: 'High', status: 'Ready', task: 'Review exchange exception queue' },
  { id: 2, owner: 'Coordinator', priority: 'Medium', status: 'In progress', task: 'Draft follow-up actions for unmatched requests' },
  { id: 3, owner: 'Steward', priority: 'Low', status: 'Queued', task: 'Attach exchange audit evidence' },
  { id: 4, owner: 'Coordinator', priority: 'High', status: 'Queued', task: 'Confirm pending childcare exchanges' },
  { id: 5, owner: 'Member support', priority: 'Medium', status: 'Ready', task: 'Review new member onboarding questions' },
  { id: 6, owner: 'Steward', priority: 'Medium', status: 'Queued', task: 'Check disputed time credit entries' },
  { id: 7, owner: 'Coordinator', priority: 'Low', status: 'Ready', task: 'Update tutoring availability' },
  { id: 8, owner: 'Member support', priority: 'Medium', status: 'Queued', task: 'Follow up on accessibility requests' },
  { id: 9, owner: 'Steward', priority: 'High', status: 'Ready', task: 'Review home repair safety notes' },
  { id: 10, owner: 'Coordinator', priority: 'Medium', status: 'Queued', task: 'Match garden help requests' },
  { id: 11, owner: 'Member support', priority: 'Low', status: 'In progress', task: 'Confirm language exchange preferences' },
  { id: 12, owner: 'Steward', priority: 'Medium', status: 'Queued', task: 'Review barter rule feedback' },
  { id: 13, owner: 'Coordinator', priority: 'Medium', status: 'Ready', task: 'Confirm transportation scheduling' },
  { id: 14, owner: 'Member support', priority: 'Low', status: 'Queued', task: 'Follow up on meal preparation offers' },
  { id: 15, owner: 'Steward', priority: 'Medium', status: 'Ready', task: 'Check weekly exchange summaries' },
];

export default function CodexOperationsFeature() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState(initialItems);
  const [task, setTask] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => Object.values(item).join(' ').toLowerCase().includes(normalized));
  }, [items, query]);

  function addTask(event) {
    event.preventDefault();
    if (!task.trim()) return;
    setItems((current) => [
      { id: Date.now(), owner: 'User', priority: 'Medium', status: 'Queued', task: task.trim() },
      ...current,
    ]);
    setTask('');
  }

  return (
    <section style={{ padding: 24, color: '#172033' }}>
      <p style={{ margin: 0, color: '#64748b', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>Non-visual workflow</p>
      <h1 style={{ margin: '6px 0 18px', fontSize: 30 }}> AI Community Coop Time Bank Platform Operations Desk</h1>

      <form onSubmit={addTask} style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) auto', gap: 10, marginBottom: 16 }}>
        <input value={task} onChange={(event) => setTask(event.target.value)} placeholder="Add an operational follow-up" style={{ padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 8 }} />
        <button type="submit" style={{ padding: '12px 16px', border: 0, borderRadius: 8, background: '#172033', color: '#ffffff', fontWeight: 700 }}>Add task</button>
      </form>

      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search owner, priority, status, or task" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 8, marginBottom: 16 }} />

      <div style={{ border: '1px solid #d7dde8', borderRadius: 8, overflow: 'hidden', background: '#ffffff' }}>
        {filtered.map((item) => (
          <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px', gap: 12, padding: 14, borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
            <strong>{item.task}</strong>
            <span>{item.owner}</span>
            <span>{item.priority}</span>
            <span>{item.status}</span>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 18, color: '#64748b' }}>No matching workflow items.</div>}
      </div>
    </section>
  );
}
