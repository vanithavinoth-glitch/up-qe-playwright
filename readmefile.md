Here is a complete, copy-pasteable README.md / Architecture & Operations Guide you can save directly into your repository (for example, at docs/QA-AGENT-ARCHITECTURE.md or README.md) to document your setup for your team.

Autonomous QA Orchestration Pipeline (VS Code Copilot + Playwright Test Agents)


1. Overview & Architecture Philosophy

This repository implements an end-to-end, human-in-the-loop QA automation pipeline built on VS Code Copilot Custom Agents, Playwright Built-in Test Agents (unmodified), and Angie Jones’s Dual-Agent Bounded Memory Architecture.

Core Design Principles

1. Zero Modification to Built-in Playwright Agents: Playwright’s native playwright-test-planner, playwright-test-generator, and playwright-test-healer remain untouched in .github/agents/. Custom wrapper and integration agents handle ingestion, formatting, reporting, and orchestration around them.
2. Angie Jones’s Dual-Agent Memory Separation: Rather than passing full conversation logs or massive documents between subagents, a dedicated @memory-librarian agent manages a 5-tier Markdown Wiki (.qa-memory/) and serves bounded 10–15 line context briefs on demand.
3. Deterministic I/O & Secret Isolation: External API integrations (TestRail, Confluence, Excel parsing) run via local Node.js/Python scripts reading .env at runtime. Credentials (APP_PASSWORD, TESTRAIL_KEY, CONFLUENCE_API_TOKEN) are never read, printed, or stored in LLM prompts or Git commits.
4. Mandatory Human-in-the-Loop Gates: Automated execution pauses strictly at two checkpoints—sequential case-by-case review and TestRail upload authorization—recording timestamped decisions for compliance auditing.

2. System & Memory Directory Structure

text
up-qe-playwright/
├── .github/
│   └── agents/
│       ├── qa-orchestrator.agent.md          # Master Controller (Super Agent)
│       ├── memory-librarian.agent.md         # Angie Jones's Scoped Memory Librarian
│       ├── ui-explorer.agent.md              # Live UI Journey Discovery (Observable-only)
│       ├── excel-extractor.agent.md          # Excel/CSV Requirement Extractor
│       ├── repo-doc-extractor.agent.md       # Markdown/PRD Repo Extractor
│       ├── playwright-test-planner.agent.md  # Built-in Playwright Planner (Untouched)
│       ├── playwright-test-generator.agent.md# Built-in Playwright Generator (Untouched)
│       ├── playwright-test-healer.agent.md   # Built-in Playwright Healer (Untouched)
│       ├── testrail-formatter.agent.md       # TestRail JSON Formatter & Uploader
│       ├── test-runner-logger.agent.md       # Execution Runner & Failure Diagnostic Logger
│       └── reporter-pr-agent.agent.md        # Confluence Audit & GitHub PR Creator
├── .qa-memory/                               # 5-Tier Cognitive Markdown Wiki
│   ├── working/                              # Scratchpad (gitignored: active-run.json, drafts)
│   ├── episodic/                             # Permanent run audit trajectories (RUN-*.md)
│   ├── semantic/                             # System/environment metadata (app-knowledge.md)
│   ├── entity/                               # Module-scoped learnings (<module>.md)
│   └── procedural/                           # Coding, locator & healer standards (qa-standards.md)
├── .qa-pipeline/
│   ├── inputs/                               # Drop zone for Excel/PRD input files
│   ├── logs/                                 # Raw Playwright JSON/list execution logs
│   └── corp-ca-bundle.pem                    # Exported macOS Root CA bundle for corporate TLS
├── scripts/
│   ├── parse_excel.py                        # Python (openpyxl) Excel-to-Markdown converter
│   ├── upload-testrail.js                    # Node.js TestRail API v2 uploader
│   └── update-confluence.js                  # Node.js Confluence REST API append-only logger
├── e2e/                                      # Seed file & generated Playwright .spec.ts suites
├── specs/                                    # Generated Markdown test plans (test-plan.md)
└── .env                                      # Local secrets & environment configuration (gitignored)
Use code with caution.

3. Agent Roster & Responsibilities


Agent Name	Type	Primary Responsibility	Output Artifact
@qa-orchestrator	Master Controller	Initializes run state, routes inputs, enforces human approval gates, coordinates phases 1–4, and triggers memory consolidation.	.qa-memory/working/active-run.json
@memory-librarian	Memory Manager	Retrieves bounded module context (RETRIEVE) before execution and archives run outcomes (CONSOLIDATE) afterward.	.qa-memory/episodic/*.md, entity/*.md
@ui-explorer	Input Extractor	Safely crawls live web apps using .env credentials without modifying production data or guessing unverified behavior.	user_journeys.json
@excel-extractor	Input Extractor	Converts .xlsx/.csv spreadsheets via venv/bin/python scripts/parse_excel.py into structured requirements.	extracted_requirements.json
@repo-doc-extractor	Input Extractor	Scans local documentation repositories and PRDs to extract documented workflows and validation rules.	extracted_requirements.json
@playwright-test-planner	Built-in (Untouched)	Consumes extracted journeys/requirements and e2e/seed.spec.ts to design positive, negative, and boundary scenarios.	specs/test-plan.md
@testrail-formatter	Integration	Maps specs/test-plan.md to TestRail JSON drafts and pushes human-approved cases via scripts/upload-testrail.js.	testrail-drafts.json, approved-testrail-cases.json
@playwright-test-generator	Built-in (Untouched)	Generates TypeScript Playwright tests tagged with TestRail Case IDs (C101 - ...) using semantic locators.	e2e/*.spec.ts
@test-runner-logger	Execution	Runs Playwright tests, captures structured pass/fail diagnostics, and triggers healing on failure.	.qa-memory/working/execution-report.json
@playwright-test-healer	Built-in (Untouched)	Repairs broken locators or timing waits (max 2 retries) without deleting or weakening expect() assertions.	Updated e2e/*.spec.ts
@reporter-pr-agent	Reporting & Git	Appends audit history to Confluence (update-confluence.js), isolates run files on a feature branch, and opens a GitHub PR.	Confluence Page Update + GitHub PR URL


4. End-to-End Execution Workflow

text
[User Input: Live URL | Excel | Docs]
                │
                ▼
  ┌──────────────────────────┐       ┌──────────────────────────┐
  │     @qa-orchestrator     │◄─────►│    @memory-librarian     │
  └─────────────┬────────────┘       └──────────────────────────┘
                │ (Phase 1: Extraction & Planning)
                ▼
  [@ui-explorer / @excel-extractor / @repo-doc-extractor]
                │
                ▼
   [@playwright-test-planner] ──► specs/test-plan.md
                │
                ▼ (Phase 2: TestRail & Human Gates)
     [@testrail-formatter] ──► GATE 1: 1-by-1 User Approval
                │           ──► GATE 2: Upload Confirmation ──► TestRail Case IDs (Cxxxx)
                ▼ (Phase 3: Generation, Execution & Healing)
  [@playwright-test-generator] ──► e2e/*.spec.ts
                │
                ▼
     [@test-runner-logger] ──► Failed? ──► [@playwright-test-healer] (Max 2 loops)
                │
                ▼ (Phase 4: Reporting, PR & Consolidation)
      [@reporter-pr-agent] ──► Append Audit to Confluence + Create GitHub PR
                │
                ▼
      [@memory-librarian]  ──► CONSOLIDATE into .qa-memory/episodic & entity
Use code with caution.

5. Environment Setup & Prerequisites


A. Software & Dependencies

• Node.js (v20+): Installed with @playwright/test@latest and dotenv.
• Python Virtual Environment (venv): Installed with openpyxl (pip install openpyxl) to parse Excel spreadsheets with zero npm audit vulnerabilities.
• GitHub CLI (gh): Authenticated locally (gh auth login) for automated Pull Request creation.

B. Required .env Configuration

Create a .env file in the repository root (ensure .env and .qa-memory/working/ are in .gitignore):
text
# Target Application (used by @ui-explorer & e2e/seed.spec.ts)
APP_URL=https://your-staging-app-url.com
APP_USERNAME=your_test_username
APP_PASSWORD=your_test_password

# TestRail API v2 Configuration
TESTRAIL_URL=https://testrail.io
TESTRAIL_USER=your-email@company.com
TESTRAIL_KEY=your-testrail-api-key
TESTRAIL_PROJECT_ID=1
TESTRAIL_SECTION_ID=1

# Confluence Audit Page Configuration
CONFLUENCE_URL=https://atlassian.net
CONFLUENCE_USER=your-email@company.com
CONFLUENCE_API_TOKEN=your-atlassian-api-token
CONFLUENCE_PAGE_ID=987654321

# GitHub PR Reviewer
GITHUB_REPO_OWNER=github-username-of-owner


C. Corporate TLS / Proxy Setup (macOS)

If running behind a corporate proxy (e.g., Zscaler/Netskope), export macOS Keychain root certificates so Node.js trusts internal TLS endpoints:
bash
security find-certificate -a -p /System/Library/Keychains/SystemRootCertificates.keychain /Library/Library/Keychains/System.keychain > .qa-pipeline/corp-ca-bundle.pem
Use code with caution.
(All integration scripts are invoked with NODE_EXTRA_CA_CERTS=.qa-pipeline/corp-ca-bundle.pem.)

6. How to Run the Pipeline

1. Open a Fresh Copilot Chat (+) in VS Code (Cmd+Ctrl+I on Mac) to ensure clean session context and low token consumption.
2. Select qa-orchestrator from the Copilot agent dropdown.
3. Provide your input prompt:
	• For a Live Application URL:"Run the complete end-to-end QA automation pipeline (Phases 1 through 4) for APP_URL configured in .env. Explore the UI, generate the test plan, format for TestRail, pause for my one-by-one case approvals and upload confirmation, generate and run the Playwright scripts, log the audit trail to Confluence, raise the GitHub PR, and consolidate memory."
	• For an Excel Spreadsheet or Docs Folder:"Run the complete end-to-end QA automation pipeline (Phases 1 through 4) using .qa-pipeline/inputs/<your-file.xlsx>. Extract requirements, generate the test plan, format for TestRail, pause for my one-by-one approvals and upload confirmation, generate and run the Playwright scripts, log the audit trail to Confluence, raise the GitHub PR, and consolidate memory."
4. Respond to the Two Approval Gates:
	• Gate 1: Reply Approve, Edit: <changes>, or Skip as each test case is presented one by one.
	• Gate 2: Reply Yes to authorize pushing the approved cases to TestRail.
5. Review Outputs: Check your Confluence audit page for the newly appended run entry and review the generated GitHub Pull Request.

7. Operational Guardrails & Best Practices

• Do Not Hardcode model: in Built-in Playwright Agents: Keep the model: line removed from playwright-test-planner.agent.md, playwright-test-generator.agent.md, and playwright-test-healer.agent.md so VS Code uses your active Copilot plan model automatically.
• Keep runInTerminal Enabled: Ensure custom agents executing scripts (qa-orchestrator, excel-extractor, testrail-formatter, test-runner-logger, reporter-pr-agent) include 'runInTerminal' in their YAML tools: list.
• Quota Optimization: Start a new chat per run, target --project=chromium during local generation/healing, and let CI handle cross-browser matrices on PRs.
Would you like me to generate a GitHub Actions CI workflow (.github/workflows/playwright.yml) next so every PR raised by @reporter-pr-agent automatically runs your Playwright test suite in CI?
