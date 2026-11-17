require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function appendToConfluence() {
  const { CONFLUENCE_URL, CONFLUENCE_USER, CONFLUENCE_API_TOKEN, CONFLUENCE_PAGE_ID } = process.env;
  if (!CONFLUENCE_URL || !CONFLUENCE_USER || !CONFLUENCE_API_TOKEN || !CONFLUENCE_PAGE_ID) {
    console.error('Missing CONFLUENCE_* variables in .env');
    process.exit(1);
  }

  const baseUrl = CONFLUENCE_URL.replace(/\/$/, '');
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
  const existingHtml = pageData.body.storage.value || '';

  // 2. Format audit entry in Confluence Storage HTML
  const approvalsHtml = (activeRun.human_approvals || [])
    .map((a) => `<li><strong>${a.temp_id}</strong>: ${a.decision} at ${a.timestamp} ${a.notes ? `(${a.notes})` : ''}</li>`)
    .join('');

  const newEntryHtml = `
    <hr />
    <h3>QA Run Audit: ${activeRun.run_id} (${execReport.overall_status || activeRun.status})</h3>
    <p><strong>Started:</strong> ${activeRun.started_at} | <strong>Inputs:</strong> ${(activeRun.inputs || []).join(', ')}</p>
    <p><strong>Agents Executed:</strong> ${(activeRun.agents_executed || []).join(' &rarr; ')}</p>
    <p><strong>Execution Metrics:</strong> Total: ${execReport.total ?? 0} | Passed: ${execReport.passed ?? 0} | Failed: ${execReport.failed ?? 0}</p>
    <p><strong>Human Approvals:</strong></p>
    <ul>${approvalsHtml || '<li>None recorded</li>'}</ul>
  `;

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
          value: existingHtml + newEntryHtml,
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
