import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AIReport from './AIReport';
import FullFieldPresets from './FullFieldPresets';
import Modal from './AIWorkspaceModal';

const API_PATH = '/api/report-workspace';
export const workspaceFields = [
  { key: 'input', label: 'Request / brief', required: true, wide: true },
  { key: 'context', label: 'Background and client context', wide: true },
  { key: 'goal', label: 'Desired outcome', required: true },
  { key: 'audience', label: 'Audience' },
  { key: 'source_data', label: 'Source data and observations', wide: true },
  { key: 'constraints', label: 'Constraints and requirements', wide: true },
  { key: 'budget', label: 'Budget and resources' },
  { key: 'deadline', label: 'Deadline', type: 'date' },
  { key: 'tone', label: 'Writing tone', options: ['Professional', 'Friendly', 'Executive'] },
  { key: 'output_format', label: 'Report format', options: ['Summary and action plan', 'Detailed report', 'Executive briefing'] },
];
const emptyFields = () => Object.fromEntries(workspaceFields.map((field) => [field.key, field.options?.[0] || '']));
const readResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || `Request failed (${response.status})`);
  return data;
};

export function workspacePresets(feature) {
  const samples = feature.samples || [];
  return ['Scenario', 'Data sample', 'Executive review'].map((label, index) => ({ label, values: {
    input: samples[index]?.value || `Prepare a ${feature.title} report for this example. Identify priorities, assumptions, risks, and next steps.`,
    context: `Illustrative time-bank planning exercise for ${feature.title}. A community steward needs a clear report before coordinating member exchanges.`,
    goal: ['Prepare an achievable plan with priorities and owners.', 'Identify patterns, gaps, and corrective actions in the supplied observations.', 'Explain the available options and the decisions needed today.'][index],
    audience: ['Community stewards and exchange coordinators', 'Member support team and reviewers', 'Time-bank governance group'][index],
    source_data: ['Illustrative: three garden help offers and five requests this month. Confirm against actual member records.', 'Illustrative: two tutoring matches are pending and one accessibility detail is missing. Verify all records.', 'Illustrative: current exchange schedule has a tight deadline and one unresolved member approval. Separate observations from assumptions.'][index],
    constraints: ['Preserve member privacy and consent; flag unverified claims and permissions.', 'Prioritize urgent member needs; identify missing evidence; do not invent exchange measurements.', 'Compare volunteer hours, timing, dependencies, and member safety; include three decisions for review.'][index],
    budget: ['Existing volunteer hours and shared tools', 'Existing coordinator capacity', 'Steward approval required for additional resources'][index],
    deadline: new Date(Date.now() + (index + 7) * 86400000).toISOString().slice(0, 10),
    tone: ['Professional', 'Friendly', 'Executive'][index],
    output_format: ['Summary and action plan', 'Detailed report', 'Executive briefing'][index],
  } })).map((preset, index) => ({
    label: feature.presets?.[index]?.label || preset.label,
    values: { ...preset.values, ...feature.presets?.[index]?.values },
  }));
}

export default function AIWorkspace({ feature, token: suppliedToken }) {
  const [fields, setFields] = useState(emptyFields);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState('');
  const [message, setMessage] = useState('');
  const request = useRef(null);
  const formRef = useRef(null);
  const token = suppliedToken || (typeof window === 'undefined' ? '' : localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('authToken') || '');
  const headers = useMemo(() => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }), [token]);
  const endpoint = API_PATH;
  const loadHistory = useCallback(async (signal) => {
    const response = await fetch(`${endpoint}/runs?feature=${encodeURIComponent(feature.id)}`, { headers, signal });
    const data = await readResponse(response);
    if (!Array.isArray(data.items)) throw new Error('Saved reports response is invalid.');
    setHistory(data.items);
  }, [endpoint, feature.id, headers]);
  useEffect(() => {
    const controller = new AbortController();
    loadHistory(controller.signal).catch((failure) => { if (failure.name !== 'AbortError') setError(failure.message); });
    return () => { controller.abort(); request.current?.abort(); request.current = null; };
    // A feature route owns its form, result, and history.
  }, [loadHistory]);

  const cancel = () => { request.current?.abort(); request.current = null; setLoading(false); setMessage('Request cancelled.'); };
  const run = async (event) => {
    event.preventDefault(); if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    setLoading(true); setError(''); setUnavailable(''); setMessage(''); setResult(null);
    try {
      const response = await fetch(`${endpoint}/run`, { method: 'POST', headers, signal: controller.signal, body: JSON.stringify({ feature: feature.id, fields, ...(editingId ? { id: editingId } : {}) }) });
      const data = await readResponse(response);
      if (request.current !== controller) return;
      if (data.unavailable) { setUnavailable(data.message); return; }
      setResult(data.item); setEditingId(data.item.id); setMessage('Report saved to your history.');
      await loadHistory(controller.signal);
    } catch (failure) { if (request.current === controller && failure.name !== 'AbortError') setError(failure.message); }
    finally { if (request.current === controller) { request.current = null; setLoading(false); } }
  };
  const edit = (item) => {
    setFields({ ...emptyFields(), ...item.input }); setEditingId(item.id); setResult(item); setSelected(null); setDeleting(false); setError(''); setUnavailable(''); setMessage('Edit any field, then generate the updated report.');
    formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };
  const remove = async () => {
    const response = await fetch(`${endpoint}/runs/${selected.id}`, { method: 'DELETE', headers });
    await readResponse(response);
    if (editingId === selected.id) { setEditingId(null); setResult(null); }
    setSelected(null); setDeleting(false); setMessage('Saved report deleted.'); await loadHistory();
  };
  return <section className="ai-workspace"><header className="ai-workspace-heading"><span className="ai-eyebrow">AI workspace · OpenRouter</span><h1>{feature.title}</h1><p>{feature.description}</p></header>
    <form className="ai-workspace-panel" onSubmit={run} ref={formRef}>
      <FullFieldPresets value={fields} presets={workspacePresets(feature)} disabled={loading} onChange={(next) => { setFields(next); setResult(null); setEditingId(null); setError(''); setUnavailable(''); setMessage('All 10 fields filled, including optional fields. Review the example before generating.'); }} />
      <div className="ai-form-grid">{workspaceFields.map((field) => <div key={field.key} className={`ai-form-field ${field.wide ? 'ai-form-field-wide' : ''}`}><label htmlFor={`${feature.id}-${field.key}`}>{field.label}<span>{field.required ? 'Required' : 'Optional'}</span></label>{field.options ? <select id={`${feature.id}-${field.key}`} value={fields[field.key]} disabled={loading} onChange={(event) => setFields({ ...fields, [field.key]: event.target.value })}>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : field.type ? <input id={`${feature.id}-${field.key}`} type={field.type} value={fields[field.key]} disabled={loading} onChange={(event) => setFields({ ...fields, [field.key]: event.target.value })} /> : <textarea id={`${feature.id}-${field.key}`} rows={field.wide ? 4 : 2} required={field.required} value={fields[field.key]} disabled={loading} onChange={(event) => setFields({ ...fields, [field.key]: event.target.value })} />}</div>)}</div>
      <footer className="ai-workspace-footer"><p className="ai-muted">Review the brief and any examples before generating.</p><div className="ai-actions"><button type="button" className="btn btn-secondary" onClick={() => { if (loading) cancel(); else { setFields(emptyFields()); setResult(null); setEditingId(null); setError(''); setMessage('Form cleared.'); } }}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading || !fields.input.trim() || !fields.goal.trim()}>{loading ? 'Generating report…' : 'Generate with OpenRouter'}</button></div></footer>
    </form>
    {message && <p role="status" className="ai-muted">{message}</p>}
    {unavailable && <section className="ai-report" role="status"><h3>AI report unavailable</h3><p>{unavailable}</p></section>}
    <AIReport response={result} loading={loading} error={error} onRetry={() => formRef.current?.requestSubmit()} title={feature.title} />
    <section className="ai-history"><h2>Saved reports</h2><p className="ai-muted">Open a report to review it, edit its inputs, or delete it.</p>{!history.length ? <p className="ai-muted">Your generated reports will appear here.</p> : history.map((item) => <button type="button" className="ai-history-row" key={item.id} onClick={() => { setSelected(item); setDeleting(false); }}><span><strong>{String(item.input?.goal || feature.title).slice(0, 100)}</strong><br /><small className="ai-muted">{new Date(item.created_at).toLocaleString()} · {item.model}</small></span><span>Open report →</span></button>)}</section>
    {selected && <Modal className="ai-workspace-dialog" title={deleting ? 'Delete saved report?' : feature.title} onClose={() => { setSelected(null); setDeleting(false); }} footer={<><button type="button" className="btn btn-secondary" onClick={() => { setSelected(null); setDeleting(false); }}>Cancel</button>{!deleting && <button type="button" className="btn btn-secondary" onClick={() => edit(selected)}>Edit</button>}<button type="button" className="btn btn-danger" onClick={() => { if (!deleting) setDeleting(true); else remove().catch((failure) => setError(failure.message)); }}>{deleting ? 'Confirm delete' : 'Delete'}</button></>}>
      {deleting ? <p>This deletes the saved report from your history.</p> : <><AIReport response={selected} title={feature.title} /><details><summary>Request inputs</summary><dl>{workspaceFields.map((field) => <React.Fragment key={field.key}><dt><strong>{field.label}</strong></dt><dd>{String(selected.input?.[field.key] || 'Not provided')}</dd></React.Fragment>)}</dl></details></>}
    </Modal>}
  </section>;
}
