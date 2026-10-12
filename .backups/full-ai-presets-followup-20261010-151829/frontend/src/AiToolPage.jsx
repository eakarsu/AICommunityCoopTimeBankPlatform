import React, { useState } from 'react';
import { postJson } from './api.js';
import AIFieldPresets, { completeExample } from './components/AIFieldPresets';
import AIResultView from './components/AIResultView';
import useCancelableAI from './components/useCancelableAI';

export default function AiToolPage({ title, intro, endpoint, fields = [] }) {
  const [form, setForm] = useState(() => Object.fromEntries(fields.map((field) => [field.name, field.default ?? ''])));
  const aiRequest = useCancelableAI();
  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const onSubmit = async (event) => {
    event.preventDefault();
    return aiRequest.run((options) => {
      const payload = { ...form };
      for (const field of fields) {
        if (field.required && (payload[field.name] === '' || payload[field.name] === undefined)) throw new Error(field.label + ' is required.');
        if (field.type === 'json' && typeof payload[field.name] === 'string' && payload[field.name].trim()) { try { payload[field.name] = JSON.parse(payload[field.name]); } catch (_) { throw new Error(field.label + ': enter valid structured data.'); } }
        if (field.type === 'number' && payload[field.name] !== '') payload[field.name] = Number(payload[field.name]);
      }
      return postJson('/api/ai/' + endpoint, payload, options);
    });
  };
  return <div className="sr-ai-workspace"><h2>{title}</h2>{intro && <p className="muted">{intro}</p>}<div className="card"><form onSubmit={onSubmit}><AIFieldPresets fields={fields} context={title} disabled={aiRequest.loading} onFill={(sample, index) => { setForm(completeExample(fields, sample, index, title, form)); aiRequest.setResult(null); }} />{fields.map((field) => <div className="form-row" key={field.name}><label htmlFor={'ai-' + field.name}>{field.label}<span className="muted">{field.required ? ' · Required' : ' · Optional'}</span></label>{field.type === 'select' ? <select id={'ai-' + field.name} value={form[field.name] ?? ''} required={field.required} onChange={(event) => update(field.name, event.target.value)}><option value="">Select…</option>{(field.options || []).map((option) => <option key={typeof option === 'object' ? option.value : option} value={typeof option === 'object' ? option.value : option}>{typeof option === 'object' ? option.label : option}</option>)}</select> : field.type === 'textarea' || field.type === 'json' ? <textarea id={'ai-' + field.name} rows={field.rows || 4} value={form[field.name] ?? ''} required={field.required} placeholder={field.placeholder || ''} onChange={(event) => update(field.name, event.target.value)} /> : <input id={'ai-' + field.name} type={field.type || 'text'} min={field.min} max={field.max} step={field.step} value={form[field.name] ?? ''} required={field.required} placeholder={field.placeholder || ''} onChange={(event) => update(field.name, event.target.value)} />}</div>)}<div className="sr-actions"><button type="submit" className="primary" disabled={aiRequest.loading}>{aiRequest.loading ? 'Preparing report…' : 'Generate with OpenRouter'}</button>{aiRequest.loading && <button type="button" onClick={aiRequest.cancel}>Cancel</button>}</div></form></div>{aiRequest.notice && <div className="sr-notice" role="status">{aiRequest.notice}</div>}<AIResultView result={aiRequest.result} loading={aiRequest.loading} error={aiRequest.error} title={title} /></div>;
}
