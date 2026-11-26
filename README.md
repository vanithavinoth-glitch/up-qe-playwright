# Python Hybrid Test Framework

A comprehensive test automation framework combining Playwright (UI), Requests (API), and LLM validation capabilities.

## Features
- UI Testing with **Playwright**
- API Testing validation
- LLM Output Validation
- **Allure** Reporting integration
- **Pytest** runner with async support

## Prerequisites
- [uv](https://github.com/astral-sh/uv) (Fast Python package installer and resolver)
- Python 3.12+

## Setup

### 1. Initialize Environment
Install dependencies and create virtual environment using `uv`:
```bash
uv sync
```

### 2. Install Playwright Browsers
```bash
uv run playwright install chromium
```

## Running Tests

### Run All Tests
```bash
uv run pytest
```

### Run Specific Tests
```bash
# Run web tests
uv run pytest tests/web

# Run specific file
uv run pytest tests/web/test_sample.py
```

### Run with Headed Mode (Visible Browser)
```bash
uv run pytest --headed
```

## Allure Reports

### Generate and View Reports
```bash
# Run tests with allure results
uv run pytest --alluredir=reports/allure-results

# Generate HTML report
allure generate reports/allure-results -o reports/allure-report --clean --single-file

# Serve report
allure serve reports/allure-results
```

## Project Structure
- `config/` - Configuration settings
- `framework/` - Core framework utilities and wrappers
- `tests/`
  - `web/` - Playwright UI tests
  - `api/` - API tests
  - `llm/` - LLM validation tests
- `reports/` - Test execution reports
- `conftest.py` - Pytest fixtures and hooks
- `pytest.ini` - Global pytest configuration
## QE Quick Start (agent testing)

1. `uv sync` (Python deps) and `npm ci` (Node deps), then `npx playwright install`.
2. `cp .env.example .env` and fill in **your own** credentials (TestRail, Confluence, app URL/user). Never commit `.env`.
3. If your network uses a corporate proxy CA, place its bundle at `.qa-pipeline/corp-ca-bundle.pem` and point `SSL_CERT_FILE` / `NODE_EXTRA_CA_CERTS` at it.
4. Put your input (Excel test cases or a spec `.md`) in `.qa-pipeline/inputs/` (see `sample-login-spec.md`).
5. In VS Code / Copilot chat, invoke the **qa-orchestrator** agent (`.github/agents/qa-orchestrator.agent.md`). The other agents are called by it.
6. Run state is written to `.qa-memory/working/` and `.qa-memory/episodic/` (git-ignored, per tester).
7. Send feedback (what worked, what broke, agent output quality) to the repo owner.

See `agent_guidence.md` for details on the agents.
