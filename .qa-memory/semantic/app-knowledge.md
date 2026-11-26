# Semantic Memory: Application & Integration Context

- **Target Application:** `APP_URL` in `.env` (`https://qa-test-flexkiosk.ks.autogridsystems.net/flex-plus/#/pages/login` — FlexPlus login page, Confirmed Non-Production QA Sandbox)
- **Authorized QA Operations:** Full end-to-end CRUD (Create, Read, Update, Delete), Program Creation, Subscription enrollment, Message Template creation, and Dispatch/Optimizer execution ARE EXPLICITLY AUTHORIZED on this QA environment.
- **Test Data Convention:** Prefix all newly created entities with `QA_AUTO_<Timestamp>_` (e.g., `QA_AUTO_Program_01`) so automated tests create real records, verify end-to-end persistence, and never touch pre-existing data.
- **TestRail:** `https://firstfuel.testrail.net` — Project ID `18`, Section ID `683374` (credentials in `.env`: `TESTRAIL_USER` / `TESTRAIL_KEY`)
- **Confluence Audit Page:** `uplightinc.atlassian.net` — Page ID `10078814243` (credentials in `.env`: `CONFLUENCE_USER` / `CONFLUENCE_API_TOKEN`)
- **GitHub Target:** repo owner `rohan.datar`, branch `main`
- **Login Credentials:** `APP_USERNAME` / `APP_PASSWORD` in `.env` (user `demopreview_admin2`, admin role). Never hardcode the password in specs or memory.
- **Network / TLS:** Corporate CA bundle at `.qa-pipeline/corp-ca-bundle.pem` (`NODE_EXTRA_CA_CERTS`); `SSL_CERT_FILE` is set for Python tooling.
