require('dotenv').config();
const fs = require('fs');
const path = require('path');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function appendToConfluence() {
  const { CONFLUENCE_URL, CONFLUENCE_USER, CONFLUENCE_API_TOKEN, CONFLUENCE_PAGE_ID } = process.env;
  if (!CONFLUENCE_URL || !CONFLUENCE_USER || !CONFLUENCE_API_TOKEN || !CONFLUENCE_PAGE_ID) {
    console.error('Missing CONFLUENCE_* variables in .env');
    process.exit(1);
  }

  const confluenceUrl = new URL(
    CONFLUENCE_URL.includes('://') ? CONFLUENCE_URL : `https://${CONFLUENCE_URL}`,
  );
  if (confluenceUrl.pathname === '/') confluenceUrl.pathname = '/wiki';
  const baseUrl = confluenceUrl.toString().replace(/\/$/, '');
  const auth = 'Basic ' + Buffer.from(`${CONFLUENCE_USER}:${CONFLUENCE_API_TOKEN}`).toString('base64');
  const headers = { 'Content-Type': 'application/json', Authorization: auth };

  const activeRun = JSON.parse(fs.readFileSync(path.join('.qa-memory', 'working', 'active-run.json'), 'utf8'));
  const execReportPath = path.join('.qa-memory', 'working', 'execution-report.json');
  const execReport = fs.existsSync(execReportPath) ? JSON.parse(fs.readFileSync(execReportPath, 'utf8')) : {};

  // 1. Fetch existing Confluence page content and version
  const getRes = await fetch(`${baseUrl}/rest/api/content/${CONFLUENCE_PAGE_ID}?expand=body.storage,version`, { headers });
  if (!getRes.ok) throw new Error(`Failed to fetch Confluence page (${getRes.status}): ${await getRes.text()}`);
  const pageData = await getRes.json();

  const currentVersion = pageData.version.number;
  let existingHtml = pageData.body.storage.value || '';

  // 2. Format audit entry in Confluence Storage HTML
  const approvalsHtml = (activeRun.human_approvals || [])
    .map((a) => `<li><strong>${escapeHtml(a.temp_id)}</strong>: ${escapeHtml(a.decision)} at ${escapeHtml(a.timestamp)} ${a.notes ? `(${escapeHtml(a.notes)})` : ''}</li>`)
    .join('');
  const uploadedCases = activeRun.upload_outcome?.audit?.uploaded_cases
    || activeRun.upload_outcome?.uploaded_cases
    || [];
  const uploadedCasesHtml = uploadedCases
    .map((id) => `<li>${escapeHtml(id)}</li>`)
    .join('');
  const generatedSpecsHtml = (activeRun.playwright_execution?.generated_specs || [])
    .map((spec) => `<li>${escapeHtml(spec)}</li>`)
    .join('');
  const pullRequestUrl = activeRun.github_pr?.url || activeRun.phase_4?.github_pr?.url;

  const newEntryHtml = `
    <hr />
    <h3>QA Run Audit: ${escapeHtml(activeRun.run_id)} (${escapeHtml(execReport.overall_status || activeRun.status)})</h3>
    <p><strong>Started:</strong> ${escapeHtml(activeRun.started_at)} | <strong>Inputs:</strong> ${(activeRun.inputs || []).map(escapeHtml).join(', ')}</p>
    <p><strong>Run Status:</strong> ${escapeHtml(activeRun.status)}</p>
    <p><strong>Agents Executed:</strong> ${(activeRun.agents_executed || []).map(escapeHtml).join(' &rarr; ')}</p>
    <p><strong>Execution Metrics:</strong> Total: ${execReport.total ?? 0} | Passed: ${execReport.passed ?? 0} | Failed: ${execReport.failed ?? 0}</p>
    <p><strong>Execution Failure Cause:</strong> ${escapeHtml(activeRun.playwright_execution?.failure_cause || 'Not recorded')}</p>
    <p><strong>Healing Attempts:</strong> ${activeRun.playwright_execution?.healing_attempts ?? 0}</p>
    <p><strong>Uploaded TestRail Cases (${activeRun.upload_outcome?.testrail_case_ids_created ?? 0}):</strong></p>
    <ul>${uploadedCasesHtml || '<li>None recorded</li>'}</ul>
    ${pullRequestUrl ? `<p><strong>GitHub Pull Request:</strong> <a href="${escapeHtml(pullRequestUrl)}">${escapeHtml(pullRequestUrl)}</a></p>` : ''}
    <p><strong>Generated Playwright Specs:</strong></p>
    <ul>${generatedSpecsHtml || '<li>None recorded</li>'}</ul>
    <p><strong>Phase 4:</strong> ${escapeHtml(activeRun.phase_4?.status || 'Not recorded')} — ${escapeHtml(activeRun.phase_4?.reason || 'No details recorded')}</p>
    <p><strong>Human Approvals:</strong></p>
    <ul>${approvalsHtml || '<li>None recorded</li>'}</ul>
  `;

  const runHeading = `QA Run Audit: ${escapeHtml(activeRun.run_id)} (`;
  const runHeadingIndex = existingHtml.lastIndexOf(runHeading);
  if (runHeadingIndex >= 0) {
    const sectionStart = existingHtml.lastIndexOf('<hr', runHeadingIndex);
    if (sectionStart >= 0) {
      const nextSectionStart = existingHtml.indexOf('<hr', runHeadingIndex);
      const sectionEnd = nextSectionStart >= 0 ? nextSectionStart : existingHtml.length;
      existingHtml = `${existingHtml.slice(0, sectionStart)}${newEntryHtml}${existingHtml.slice(sectionEnd)}`;
    }
  } else {
    existingHtml += newEntryHtml;
  }

  // 3. Update page with incremented version
  const updateRes = await fetch(`${baseUrl}/rest/api/content/${CONFLUENCE_PAGE_ID}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      id: CONFLUENCE_PAGE_ID,
      type: 'page',
      title: pageData.title,
      version: { number: currentVersion + 1 },
      body: {
        storage: {
          value: existingHtml,
          representation: 'storage',
        },
      },
    }),
  });

  if (!updateRes.ok) throw new Error(`Confluence update failed (${updateRes.status}): ${await updateRes.text()}`);
  console.log(`Successfully updated Confluence page "${pageData.title}" (v${currentVersion + 1})`);
}

appendToConfluence().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
