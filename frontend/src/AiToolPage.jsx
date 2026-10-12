import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch, postJson } from './api.js';
import AIFieldPresets, { completeExample } from './components/AIFieldPresets';
import AIResultView, { readableLabel } from './components/AIResultView';
import useCancelableAI from './components/useCancelableAI';

const requestValues = (request) => {
  if (!request) return {};
  if (typeof request !== 'string') return request;
  try { return JSON.parse(request); } catch (_) { return {}; }
};

export default function AiToolPage({ title, intro, endpoint, fields = [] }) {
  const [form, setForm] = useState(() => Object.fromEntries(fields.map((field) => [field.name, field.default ?? ''])));
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const aiRequest = useCancelableAI();

  const update = (name, value) => setForm((currentForm) => ({ ...currentForm, [name]: value }));
  const loadHistory = useCallback(async (signal) => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const data = await apiFetch(`/api/ai/history?endpoint=${encodeURIComponent(endpoint)}&limit=20`, { signal });
      setHistory(Array.isArray(data.results) ? data.results : []);
    } catch (failure) {
      if (failure.name !== 'AbortError') setHistoryError(failure.message || 'Saved reports could not be loaded.');
    } finally {
      if (!signal?.aborted) setHistoryLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    const controller = new AbortController();
    loadHistory(controller.signal);
    return () => controller.abort();
  }, [loadHistory]);

  const generate = async () => {
    const response = await aiRequest.run((options) => {
      const payload = { ...form };
      for (const field of fields) {
        if (field.required && (payload[field.name] === '' || payload[field.name] === undefined)) throw new Error(`${field.label} is required.`);
        if (field.type === 'json' && typeof payload[field.name] === 'string' && payload[field.name].trim()) {
          try { payload[field.name] = JSON.parse(payload[field.name]); }
          catch (_) { throw new Error(`${field.label}: enter valid structured data.`); }
        }
        if (field.type === 'number' && payload[field.name] !== '') payload[field.name] = Number(payload[field.name]);
      }
      return postJson(`/api/ai/${endpoint}`, payload, options);
    });
    if (response) await loadHistory();
    return response;
  };

  const onSubmit = (event) => {
    event.preventDefault();
    return generate();
  };

  return (
    <div className="sr-ai-workspace">
      <h2>{title}</h2>
      {intro && <p className="muted">{intro}</p>}
      <div className="card">
        <form onSubmit={onSubmit}>
          <AIFieldPresets
            fields={fields}
            context={title}
            disabled={aiRequest.loading}
            onFill={(sample, index) => {
              setForm(completeExample(fields, sample, index, title, form));
              aiRequest.setResult(null);
              aiRequest.setError(null);
            }}
          />
          {fields.map((field) => (
            <div className="form-row" key={field.name}>
              <label htmlFor={`ai-${field.name}`}>
                {field.label}<span className="muted">{field.required ? ' · Required' : ' · Optional'}</span>
              </label>
              {field.type === 'select' ? (
                <select id={`ai-${field.name}`} value={form[field.name] ?? ''} required={field.required} onChange={(event) => update(field.name, event.target.value)}>
                  <option value="">Select…</option>
                  {(field.options || []).map((option) => {
                    const value = typeof option === 'object' ? option.value : option;
                    return <option key={value} value={value}>{typeof option === 'object' ? option.label : option}</option>;
                  })}
                </select>
              ) : field.type === 'textarea' || field.type === 'json' ? (
                <textarea id={`ai-${field.name}`} rows={field.rows || 4} value={form[field.name] ?? ''} required={field.required} placeholder={field.placeholder || ''} onChange={(event) => update(field.name, event.target.value)} />
              ) : (
                <input id={`ai-${field.name}`} type={field.type || 'text'} min={field.min} max={field.max} step={field.step} value={form[field.name] ?? ''} required={field.required} placeholder={field.placeholder || ''} onChange={(event) => update(field.name, event.target.value)} />
              )}
            </div>
          ))}
          <div className="sr-actions">
            <button type="submit" className="primary" disabled={aiRequest.loading}>{aiRequest.loading ? 'Preparing report…' : 'Generate with OpenRouter'}</button>
            {aiRequest.loading && <button type="button" onClick={aiRequest.cancel}>Cancel</button>}
          </div>
        </form>
      </div>
      {aiRequest.notice && <div className="sr-notice" role="status">{aiRequest.notice}</div>}
      <AIResultView result={aiRequest.result} loading={aiRequest.loading} error={aiRequest.error} onRetry={generate} title={title} />

      <section className="sr-saved-reports" aria-labelledby={`saved-${endpoint}`}>
        <header>
          <div>
            <span className="sr-eyebrow">Report history</span>
            <h2 id={`saved-${endpoint}`}>Saved {title} reports</h2>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" disabled={historyLoading} onClick={() => loadHistory()}>{historyLoading ? 'Refreshing…' : 'Refresh'}</button>
        </header>
        {historyError && <div className="sr-alert" role="alert"><span>{historyError}</span><button type="button" className="btn btn-secondary btn-sm" onClick={() => loadHistory()}>Retry</button></div>}
        {!historyLoading && !historyError && history.length === 0 && <p className="muted">Generated reports will appear here automatically.</p>}
        <div className="sr-saved-list">
          {history.map((item, index) => {
            const inputs = requestValues(item.request_params);
            return (
              <details className="sr-saved-card" key={item.id} open={index === 0}>
                <summary>
                  <span><strong>{title}</strong><small>{new Date(item.created_at).toLocaleString()}</small></span>
                  <span>View report</span>
                </summary>
                <AIResultView response={item.result_text} model={item.model_used} tokens={item.tokens_used} title={title} label="Saved response" />
                <details className="sr-request-inputs">
                  <summary>Request inputs</summary>
                  <dl>{fields.map((field) => <div key={field.name}><dt>{readableLabel(field.label)}</dt><dd>{String(inputs[field.name] ?? 'Not provided')}</dd></div>)}</dl>
                </details>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
