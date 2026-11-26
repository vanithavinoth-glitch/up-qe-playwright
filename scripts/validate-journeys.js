#!/usr/bin/env node
/**
 * Validates user_journeys.json produced by @ui-explorer.
 * Usage: node scripts/validate-journeys.js [path]   (exit 1 on any ERROR)
 * Rule: downstream agents generate code from this file, so forms must be STRUCTURED, not prose.
 */
const fs = require('fs');
const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const file = args.find((a) => !a.startsWith('--')) || 'user_journeys.json';
const errors = [];
const warns = [];
const err = (m) => errors.push(m);

let data;
try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.error(`ERROR cannot read ${file}: ${e.message}`); process.exit(1); }

const CONTROL_TYPES = ['text', 'textarea', 'dropdown-button', 'native-select', 'checkbox', 'radio', 'date', 'button'];
const REQUIRED = ['true', 'false', 'unknown'];
const FORMISH = /\b(add|create|new|form|dialog|wizard|submit|configure|dispatch)\b/i;
const journeys = Array.isArray(data.journeys) ? data.journeys : [];
if (!journeys.length) err('no journeys found');

journeys.forEach((j, ji) => {
  const where = `journey[${ji}] "${j.name || j.journey_id || '?'}"`;
  if (!j.name) err(`${where}: missing name`);
  const text = JSON.stringify(j.observed || j.steps || '');
  const forms = Array.isArray(j.forms) ? j.forms : [];
  if (!forms.length && !String(j.no_forms_reason || '').trim() && FORMISH.test(text)) err(`${where}: mentions a form/dialog/creation action but has no structured "forms" entry (or a "no_forms_reason" explaining why none exist)`);
  if (/BLOCKED|NOT_IMPLEMENTED/.test(j.exploration_status || '') && !(j.evidence_notes || []).length) {
    err(`${where}: marked ${j.exploration_status} without evidence_notes (a saved snapshot reference is required)`);
  }
  // detail_views: key-value dialogs/pages (e.g. event detail). Optional, but must be well-formed when present.
  const views = j.detail_views === undefined ? [] : j.detail_views;
  if (!Array.isArray(views)) err(`${where}: detail_views must be an array`);
  else views.forEach((v, vi) => {
    const vw = `${where} detail_view[${vi}] "${v.view || '?'}"`;
    if (!v.view) err(`${vw}: missing view`);
    if (!v.open_action) err(`${vw}: missing open_action`);
    if (!Array.isArray(v.fields) || !v.fields.length) err(`${vw}: fields must be a non-empty array of {label, value}`);
    else v.fields.forEach((fl, fi) => { if (!fl || !fl.label || !('value' in fl)) err(`${vw} field[${fi}]: needs label and value`); });
  });
  // unverifiable_in_ui: backend outcomes the UI cannot show. Optional, but must be well-formed when present.
  const unver = j.unverifiable_in_ui === undefined ? [] : j.unverifiable_in_ui;
  const VERIFY = ['API', 'DB', 'logs', 'email/SMS inbox', 'unknown'];
  if (!Array.isArray(unver)) err(`${where}: unverifiable_in_ui must be an array`);
  else unver.forEach((u, ui) => {
    const uw = `${where} unverifiable_in_ui[${ui}]`;
    if (!u.assertion) err(`${uw}: missing assertion`);
    if (!('ui_evidence_available' in u)) err(`${uw}: missing ui_evidence_available (use null if none)`);
    if (!VERIFY.includes(u.suggested_verification)) err(`${uw}: suggested_verification must be one of ${VERIFY.join(', ')}`);
  });
  // Warnings (non-fatal): depth hints so shallow dispatch/event journeys are visible.
  if (/dispatch|event/i.test(text) && !views.length) warns.push(`${where}: mentions dispatch/event but has no detail_views (open one event row and record its dialog fields)`);
  if (/dispatch|notification/i.test(text) && !unver.length) warns.push(`${where}: mentions dispatch/notification but has no unverifiable_in_ui (record backend outcomes the UI cannot show, or confirm none apply)`);

  forms.forEach((f, fi) => {
    const fw =`${where} form[${fi}] "${f.name || '?'}"`;
    ['name', 'open_action', 'submit_locator', 'cancel_locator'].forEach((k) => { if (!f[k]) err(`${fw}: missing ${k}`); });
    if (!Array.isArray(f.validation_messages)) err(`${fw}: validation_messages must be an array (use [] if none observed)`);
    if (!('success_result' in f)) err(`${fw}: missing success_result (use null if not submitted, and say why in evidence_notes)`);
    const controls = Array.isArray(f.controls) ? f.controls : [];
    if (!controls.length) err(`${fw}: no controls recorded`);
    controls.forEach((c, ci) => {
      const cw = `${fw} control[${ci}] "${c.label || '?'}"`;
      if (!c.label) err(`${cw}: missing label`);
      if (!CONTROL_TYPES.includes(c.control_type)) err(`${cw}: control_type must be one of ${CONTROL_TYPES.join(', ')}`);
      if (!c.locator) err(`${cw}: missing locator`);
      if (!REQUIRED.includes(String(c.required))) err(`${cw}: required must be true|false|unknown`);
      if (String(c.required) === 'true' && !c.required_evidence) err(`${cw}: required=true needs required_evidence`);
      if (['dropdown-button', 'native-select'].includes(c.control_type) && !(Array.isArray(c.options) && c.options.length)) {
        err(`${cw}: dropdown without options (open the menu and read the exact option texts)`);
      }
    });
  });
});

if (STRICT) {
  const STATUS = ['EXPLORED', 'PARTIALLY_EXPLORED', 'BLOCKED', 'NOT_SAFE_TO_EXPLORE', 'COMPLETED'];
  const TESTABILITY = ['UI_ONLY', 'UI_PLUS_API', 'NEEDS_BACKEND_VERIFICATION', 'NOT_UI_TRIGGERABLE'];
  // Depth warnings become errors.
  warns.forEach((w) => err('[strict] ' + w));
  warns.length = 0;
  journeys.forEach((j, ji) => {
    const where = `journey[${ji}] "${j.name || '?'}"`;
    if (!j.journey_id) err(`[strict] ${where}: missing journey_id`);
    if (!Array.isArray(j.steps) || !j.steps.length) err(`[strict] ${where}: missing structured steps[] (legacy "observed" prose is not accepted)`);
    if (!STATUS.includes(j.exploration_status)) err(`[strict] ${where}: exploration_status must be one of ${STATUS.join(', ')}`);
    if (!TESTABILITY.includes(j.testability)) err(`[strict] ${where}: testability must be one of ${TESTABILITY.join(', ')}`);
    if (!Array.isArray(j.data_requirements)) err(`[strict] ${where}: data_requirements must be an array`);
    if (!Array.isArray(j.evidence_snapshots) || !j.evidence_snapshots.length) err(`[strict] ${where}: evidence_snapshots must list saved snapshot paths`);
    if (j.exploration_status !== 'EXPLORED' && j.exploration_status !== 'COMPLETED' && !j.blocked_reason) err(`[strict] ${where}: not fully explored but no blocked_reason`);
  });
  const c = data.coverage;
  if (!c || typeof c !== 'object') err('[strict] missing top-level "coverage" ledger');
  else {
    ['nav_items', 'detail_page_tabs', 'tables', 'entity_types_swept', 'workflow_gaps', 'frontier'].forEach((k) => { if (!Array.isArray(c[k])) err(`[strict] coverage.${k} must be an array`); });
    if (!(c.nav_items || []).length) err('[strict] coverage.nav_items is empty: every navigation item must be listed');
    (c.nav_items || []).forEach((n, i) => { if (!n.label || !STATUS.includes(n.status)) err(`[strict] coverage.nav_items[${i}]: needs label and a valid status`); });
    (c.detail_page_tabs || []).forEach((t, i) => { if (!t.page || !t.tab || !t.status || !t.evidence) err(`[strict] coverage.detail_page_tabs[${i}]: needs page, tab, status, evidence`); });
    (c.tables || []).forEach((t, i) => { if (!t.table) err(`[strict] coverage.tables[${i}]: missing table`); else if (t.row_opened !== true && !t.reason_if_not_opened) err(`[strict] coverage.tables[${i}] "${t.table}": row not opened and no reason_if_not_opened`); });
    (c.entity_types_swept || []).forEach((e, i) => {
      const seen = e.values_seen || [], done = e.values_explored || [];
      const missing = seen.filter((v) => !done.includes(v));
      if (missing.length && !e.reason_unexplored) err(`[strict] coverage.entity_types_swept[${i}] "${e.dimension}": values not explored (${missing.join(', ')}) and no reason_unexplored`);
    });
    (c.workflow_gaps || []).forEach((g, i) => { if (!g.process || !(g.searched || []).length || !g.evidence) err(`[strict] coverage.workflow_gaps[${i}]: needs process, searched[], evidence`); });
    (c.frontier || []).forEach((f, i) => { if (!f.element || !f.reason_not_visited) err(`[strict] coverage.frontier[${i}]: needs element and reason_not_visited`); });
  }
}

if (errors.length) {
  console.error(`journeys validation FAILED (${errors.length} error(s)):`);
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}
if (warns.length) {
  console.warn(`journeys validation WARNINGS (${warns.length}, non-fatal):`);
  warns.forEach((w) => console.warn('  - ' + w));
}
console.log(`journeys validation OK (${journeys.length} journeys)`);
