import React from 'react';
import './SharedRecordUI.css';

const optionValue = (option) => typeof option === 'object' ? option.value ?? option.id ?? option.label : option;
const present = (value) => value !== undefined && value !== null && String(value).trim() !== '';
const readable = (value) => String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
const recordField = (key) => /(?:^id$|_id$|Id$)/.test(key);
const scenarios = [
  { memberSkills: 'Bicycle repair and route planning', memberNeeds: 'Help preparing a raised garden bed', neighborhood: 'Southside', availability: 'Saturday mornings', taskDescription: 'Repair a neighbor’s bicycle brakes', durationHours: 2, complexity: 'Standard mechanical repair', riskLevel: 'Check brakes with the owner before riding', memberName: 'Jordan', background: 'New member who enjoys gardening and bicycle repair', goals: 'Exchange practical skills and meet nearby members', partyAStatement: 'The repair took longer than expected.', partyBStatement: 'The agreed two-hour window was exceeded.', exchangeContext: 'Two-hour bicycle repair exchange with a delayed part', creditsAtStake: '2 time credits', season: 'Spring', recentTrends: 'Illustrative: garden help requests rise in spring; verify with actual exchange data.', issue: 'Improve scheduling for shared tools', options: 'Shared calendar; weekly sign-up; tool steward', stakeholders: 'Members who borrow or maintain shared tools', currentSkills: 'Bicycle repair, tutoring, gardening', communityNeeds: 'More weekend garden and mobility help', recruitmentBudget: 'Volunteer outreach only', rawDescription: 'I can help tune bicycles on Saturday mornings near Southside.', accessibility: 'Ground-floor meeting place available', period: 'Q2 2026', totalHours: 120, exchangeCount: 48, demographics: 'Illustrative totals only; replace with consented aggregate member data.' },
  { memberSkills: 'English conversation and resume review', memberNeeds: 'Basic computer setup', neighborhood: 'Riverside', availability: 'Weekday evenings', taskDescription: 'Review a member’s resume and cover letter', durationHours: 1, complexity: 'Standard writing support', riskLevel: 'Keep personal documents private', memberName: 'Samira', background: 'New member with language tutoring experience', goals: 'Offer conversation practice and learn about local services', partyAStatement: 'The appointment was rescheduled without enough notice.', partyBStatement: 'A childcare conflict prevented attendance.', exchangeContext: 'One-hour tutoring exchange rescheduled the same day', creditsAtStake: '1 time credit', season: 'Autumn', recentTrends: 'Illustrative: tutoring requests increase after school starts; verify with actual records.', issue: 'Make exchange cancellation rules clearer', options: 'Reminder message; flexible rescheduling; member discussion', stakeholders: 'Tutors, learners, and coordinators', currentSkills: 'Language tutoring, editing, computer basics', communityNeeds: 'Evening digital literacy support', recruitmentBudget: 'Existing volunteer hours', rawDescription: 'I offer resume reviews and English conversation on weekday evenings.', accessibility: 'Video call or wheelchair accessible library room', period: 'Q3 2026', totalHours: 95, exchangeCount: 39, demographics: 'Illustrative aggregate description; confirm against consented records.' },
  { memberSkills: 'Meal preparation and grocery planning', memberNeeds: 'Help assembling flat-pack furniture', neighborhood: 'North End', availability: 'Sunday afternoons', taskDescription: 'Plan and prepare three freezer meals with a neighbor', durationHours: 3, complexity: 'Standard meal preparation', riskLevel: 'Confirm allergies and kitchen access', memberName: 'Alex', background: 'New member interested in mutual aid cooking', goals: 'Share affordable cooking skills and request occasional household help', partyAStatement: 'The grocery budget was not agreed in advance.', partyBStatement: 'Several ingredients cost more than expected.', exchangeContext: 'Meal planning exchange with an unconfirmed grocery budget', creditsAtStake: '3 time credits', season: 'Winter', recentTrends: 'Illustrative: indoor support requests may rise in winter; verify with actual records.', issue: 'Clarify material costs before exchanges', options: 'Written budget agreement; cost cap; coordinator review', stakeholders: 'Members and exchange coordinators', currentSkills: 'Meal preparation, furniture assembly, translation', communityNeeds: 'Affordable meal planning and household support', recruitmentBudget: 'No cash budget; volunteer coordination', rawDescription: 'I can plan affordable freezer meals on Sunday afternoons in the North End.', accessibility: 'Confirm kitchen accessibility and dietary needs', period: 'Q4 2026', totalHours: 140, exchangeCount: 54, demographics: 'Illustrative aggregates; use verified consented data in a real report.' },
];

/** Fill declared fields only. Existing scenario data and valid choices take priority. */
export function completeExample(fields, sample = {}, variant = 0, context = 'this feature', current = {}) {
  const provided = sample.values || sample.data || sample;
  const result = {};
  const date = new Date(); date.setDate(date.getDate() + 7 + variant * 7);
  for (const field of fields || []) {
    const key = field.key || field.name;
    if (!key) continue;
    if (recordField(key) || field.requiresExistingRecord || field.type === 'file') {
      result[key] = current[key] ?? '';
      continue;
    }
    const type = field.type || field.kind || 'text';
    const options = (field.options || []).map(optionValue).filter(present);
    let value = provided[key] ?? scenarios[variant % scenarios.length][key];
    if (!present(value)) value = field.defaultValue ?? field.default ?? field.example;
    if (type === 'select' && options.length) {
      value = options.some((option) => String(option) === String(value)) ? value : options[variant % options.length];
    } else if (type === 'number' || type === 'range') {
      const parsed = Number(value);
      const fallback = /percent|rate|ratio|confidence/i.test(key) ? [25, 50, 75][variant % 3] : [1, 10, 25][variant % 3];
      value = present(value) && Number.isFinite(parsed) ? parsed : fallback;
      if (field.min !== undefined) value = Math.max(Number(field.min), value);
      if (field.max !== undefined) value = Math.min(Number(field.max), value);
    } else if (type === 'date') {
      value = /^\d{4}-\d{2}-\d{2}/.test(String(value || '')) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10);
    } else if (type === 'datetime-local') {
      value = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(String(value || '')) ? String(value).slice(0, 16) : `${date.toISOString().slice(0, 10)}T09:00`;
    } else if (type === 'month') value = date.toISOString().slice(0, 7);
    else if (type === 'time') value = present(value) ? value : ['09:00', '13:30', '16:00'][variant % 3];
    else if (type === 'checkbox' || type === 'boolean') value = typeof value === 'boolean' ? value : variant !== 1;
    else if (type === 'json') {
      if (!present(value) && field.placeholder) { try { value = JSON.parse(String(field.placeholder).replace(/,\s*\.\.\.\s*/g, '').replace(/\.\.\.\s*,?/g, '')); } catch (_) { /* Use an explicit illustrative object below. */ } }
      if (!present(value)) value = /array|list/i.test(field.label || '') || /issues|guests|records|items|people|claims|changes/.test(key) ? [{ description: `Illustrative ${readable(key)} for review`, severity: ['low', 'medium', 'high'][variant % 3], evidence: 'Example input; replace with your own source evidence' }] : { example: true, context: readable(context), observations: ['Illustrative inputs for review'], constraints: ['Validate against your actual source records'] };
      value = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    } else if (!present(value)) {
      const label = readable(field.label || key);
      if (type === 'color' || /hex|primary_color|brand_color/i.test(`${key} ${field.label || ''}`)) value = ['#2563eb', '#166534', '#7c3aed'][variant % 3];
      else if (type === 'email' || /email/i.test(key)) value = `example${variant + 1}@example.com`;
      else if (type === 'url' || /website|url/i.test(key)) value = `https://example.com/scenario-${variant + 1}`;
      else if (type === 'tel' || /phone/i.test(key)) value = '+1 202 555 0100';
      else if (/budget|cost|amount|revenue|price/i.test(key)) value = ['2500', '10000', '25000'][variant % 3];
      else if (/language/i.test(key)) value = ['English', 'Spanish', 'French'][variant % 3];
      else if (/format/i.test(key)) value = 'Summary, findings, and prioritized actions';
      else if (/tone/i.test(key)) value = ['Professional', 'Clear and concise', 'Executive'][variant % 3];
      else if (/html/i.test(key)) value = `<main><h1>Example page ${variant + 1}</h1><p>Illustrative page content for an accessibility review.</p><form><label for="example-email">Email address</label><input id="example-email" type="email" /><button type="submit">Send request</button></form><img src="https://example.com/image.png" alt="Illustrative landscape" /></main>`;
      else if (type === 'textarea' || /context|brief|description|notes|constraint|goal|objective|data|text|prompt/i.test(key)) value = `Example ${variant + 1} for ${readable(context)}. ${label}: review the supplied information, identify the main issues, and propose a practical next step. Treat these values as illustrative; identify assumptions and missing evidence.`;
      else value = `${label} — example ${variant + 1}`;
    }
    if (type !== 'json' && value && typeof value === 'object') value = Array.isArray(value) ? value.map((item) => typeof item === 'object' ? Object.values(item).join(' · ') : item).join('\n') : Object.entries(value).map(([name, item]) => `${readable(name)}: ${item}`).join('\n');
    result[key] = value;
  }
  return result;
}

export default function AIFieldPresets({ fields, samples = [], onFill, disabled, context }) {
  if (!fields?.length) return null;
  const examples = samples.length >= 3 ? samples.slice(0, 5) : Array.from({ length: 3 }, (_, index) => samples[index] || { label: ['Neighborhood exchange', 'Learning support', 'Mutual aid planning'][index] });
  return <section className="sr-presets"><div><strong>Fill every field</strong><p>Each example fills required and optional inputs. Review the values and any record references before generating.</p>{fields.some((field) => recordField(field.key || field.name) || field.requiresExistingRecord) && <p>Enter a real member or record ID before generating. Examples keep any ID already entered.</p>}{fields.some((field) => field.type === 'file') && <p>Select a real file yourself. Examples keep existing uploads.</p>}</div><div className="sr-actions">{examples.map((sample, index) => <button key={index} type="button" className="btn secondary btn-secondary" disabled={disabled} onClick={() => onFill(sample, index)}>{sample.label || `Example ${index + 1}`}</button>)}</div></section>;
}
