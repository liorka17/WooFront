# docs/16_workflow_daily_notes.md

# Daily Workflow Notes

## Purpose
A lightweight daily log to track what was done, what changed, what broke, and what is next.
Use this as the single source of truth for day to day progress, then summarize key items into:
1. 12_change_log.md for actual changes
2. 13_decisions_log.md for architectural or security decisions

## How to use
1. Create one entry per day
2. Keep entries factual and verifiable
3. If you touched code, always add the file paths
4. If you ran tests, record the exact commands and results
5. If something is broken, record reproduction steps

---

## Entry Template

### Date
YYYY-MM-DD

### Focus for today
What is the single most important outcome

### Work completed
1.
2.
3.

### Files touched
Backend
1.
2.

Frontend
1.
2.

Docs
1.
2.

### Commands run
1.
2.

### Verification
Manual checks
1.
2.

Automated checks
1.
2.

### Issues found
1. Symptom
   Repro steps
   Suspected cause
   Current status

### Decisions made
1. Decision
   Reason
   Impact
   Link to 13_decisions_log.md entry if created

### Risks and follow ups
1.
2.

### Next session plan
1.
2.

---

## Example Entry

### Date
2025-12-28

### Focus for today
Stabilize the integrations onboarding flow and ensure backend enforces prerequisites

### Work completed
1. Documented API contract for integrations and client key generation
2. Added troubleshooting guide for step gating and server side validation
3. Defined release checklist and daily log workflow

### Files touched
Docs
1. docs/04_backend_api_contract.md
2. docs/11_troubleshooting.md
3. docs/14_release_checklist.md
4. docs/16_workflow_daily_notes.md

### Commands run
1. npm test
2. ng build

### Verification
Manual checks
1. Open integrations screen and confirm step order is enforced
2. Attempt generate without prerequisites and confirm backend rejects

### Issues found
1. Generate allowed without prerequisites
   Repro steps
   1. Call POST /api/me/client-key without saving integrations
   Suspected cause
   Missing DB prerequisite validation
   Current status
   Open

### Decisions made
1. Backend is source of truth for readiness
   Reason
   UI can be bypassed
   Impact
   All generate rules must be server enforced
   Link
   docs/13_decisions_log.md

### Risks and follow ups
1. Secrets logging risk if debug logs include payloads
2. Need to confirm encryption utility is used consistently

### Next session plan
1. Fix prerequisite validation in backend
2. Implement strict step gating in UI
3. Add smoke tests and record in change log
