require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function uploadToTestRail() {
  const { TESTRAIL_URL, TESTRAIL_USER, TESTRAIL_KEY, TESTRAIL_PROJECT_ID, TESTRAIL_SECTION_ID } = process.env;
  if (!TESTRAIL_URL || !TESTRAIL_USER || !TESTRAIL_KEY || !TESTRAIL_PROJECT_ID) {
    console.error('Missing required TESTRAIL_* environment variables in .env');
    process.exit(1);
  }

  const baseUrl = TESTRAIL_URL.replace(/\/$/, '');
  const authHeader = 'Basic ' + Buffer.from(`${TESTRAIL_USER}:${TESTRAIL_KEY}`).toString('base64');
  const headers = { 'Content-Type': 'application/json', Authorization: authHeader };

  const draftsPath = path.join('.qa-memory', 'working', 'testrail-drafts.json');
  const { drafts } = JSON.parse(fs.readFileSync(draftsPath, 'utf8'));
  const approved = drafts.filter((d) => d.approval_status === 'APPROVED');

  if (approved.length === 0) {
    console.log('No APPROVED test cases found to upload.');
    process.exit(0);
  }

  // Resolve target Section ID
  let sectionId = TESTRAIL_SECTION_ID;
  if (!sectionId) {
    const secRes = await fetch(`${baseUrl}/index.php?/api/v2/get_sections/${TESTRAIL_PROJECT_ID}`, { headers });
    const secData = await secRes.json();
    const sections = Array.isArray(secData) ? secData : secData.sections || [];
    if (sections.length === 0) throw new Error('No sections found in TestRail project.');
    sectionId = sections[0].id;
  }

  const uploadedCases = [];
  for (const tc of approved) {
    const payload = {
      title: tc.title,
      custom_preconds: tc.preconditions || '',
      custom_steps_separated: (tc.steps || []).map((s) => ({
        content: s.step,
        expected: s.expected,
      })),
    };

    const res = await fetch(`${baseUrl}/index.php?/api/v2/add_case/${sectionId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`TestRail API error (${res.status}): ${errText}`);
    }

    const created = await res.json();
    uploadedCases.push({
      testrail_id: `C${created.id}`,
      temp_id: tc.temp_id,
      module: tc.module,
      title: tc.title,
      preconditions: tc.preconditions,
      steps: tc.steps,
    });
    console.log(`Uploaded ${tc.temp_id} -> TestRail Case C${created.id}`);
  }

  const outPath = path.join('.qa-memory', 'working', 'approved-testrail-cases.json');
  fs.writeFileSync(outPath, JSON.stringify({ uploaded_cases: uploadedCases }, null, 2));
  console.log(`Saved ${uploadedCases.length} uploaded cases to ${outPath}`);
}

uploadToTestRail().catch((err) => {
  console.error('TestRail upload failed:', err.message);
  process.exit(1);
});

