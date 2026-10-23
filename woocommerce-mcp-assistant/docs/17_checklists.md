# docs/17_checklists.md

# Checklists

## Purpose
This file contains short operational checklists you can reuse every time, without rethinking the basics.
Add new checklists at the bottom over time.

## Conventions
1. Keep checklists short and executable
2. Prefer copy paste commands
3. Record results in docs/16_workflow_daily_notes.md
4. If a checklist fails, add a note in docs/11_troubleshooting.md

---

## Checklist A: Before you start a session

1. Pull latest changes
   1. git status
   2. git pull

2. Confirm environment variables exist
   1. Backend env file present
   2. Frontend env or proxy config present

3. Run quick health checks
   1. Backend starts without crash
   2. Frontend builds without errors

4. Pick one objective for the session
   1. Write it in docs/16_workflow_daily_notes.md

---

## Checklist B: Before a frontend commit

1. Formatting and lint
   1. npm run lint
   2. npm run build

2. UI smoke test
   1. Navigate to Integrations page
   2. Confirm step starts at Step 1
   3. Confirm step navigation is gated
   4. Confirm Update is blocked when required fields are empty
   5. Confirm Generate is blocked until prerequisites are satisfied
   6. Confirm no duplicate success messages

3. Security UX
   1. Woo keys inputs are masked by default
   2. Show button is aligned inside the input line
   3. Copy button works and feedback is shown once

4. Commit message includes scope
   1. Example: feat(ui): gated onboarding steps for integrations
   2. Example: fix(ui): prevent save when required fields missing

---

## Checklist C: Before a backend commit

1. Type safety and build
   1. npm run build
   2. npm test if available

2. API contract sanity
   1. GET /api/me/integrations returns required flags
      1. has_woo_ck
      2. has_woo_cs
      3. has_client_key_hash
   2. PUT /api/me/integrations never stores empty secrets
   3. POST /api/me/client key rejects if prerequisites missing in DB

3. Security
   1. Secrets are encrypted before storing
   2. Secrets are never returned to frontend
   3. Client key hash is stored, not the client key plain
   4. Logs do not print secrets or tokens

4. Database migration safety
   1. Columns exist and are named correctly
   2. New fields are nullable if rollout is gradual
   3. Any unique constraint is intentional and documented

---

## Checklist D: Before merging to main

1. Ensure branch is up to date
   1. git pull
   2. resolve conflicts if any

2. Run build for both sides
   1. Backend build passes
   2. Frontend build passes

3. Manual end to end test
   1. Login
   2. Open Integrations
   3. Complete Step 1 then Step 2 then Step 3
   4. Save integrations
   5. Generate client key
   6. Copy client key
   7. Refresh page and confirm correct status is displayed

4. Update docs
   1. docs/12_change_log.md add entry
   2. docs/13_decisions_log.md add entry if needed
   3. docs/11_troubleshooting.md add entry if you fixed a bug pattern

---

## Checklist E: Release and deploy

1. Create a release note entry
   1. docs/14_release_checklist.md
   2. docs/12_change_log.md

2. Deploy backend first
   1. Confirm env variables exist
   2. Confirm DB connection works
   3. Confirm /api/me/integrations responds

3. Deploy frontend next
   1. Confirm proxy routing if used
   2. Confirm authentication flow still works
   3. Confirm Integrations page loads without console errors

4. Post deploy validation
   1. Generate is blocked without prerequisites
   2. Generate works when prerequisites exist
   3. Client key hash stored in DB
   4. No secrets leaked in responses
