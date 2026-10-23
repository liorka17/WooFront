# docs/09_testing_guide.md

# Testing Guide

## What to test every time
1. Load integrations populates form fields correctly
2. Step gating prevents skipping forward
3. Update with missing required values is blocked
4. Update with empty values does not erase stored secrets
5. Generate fails without prerequisites
6. Generate works only when prerequisites exist in database
7. Generate second time does not reveal key
8. Copy actions work and show a toast

## Manual test scripts

### Script 1 New user happy path
1. Open integrations screen
2. Fill store details
3. Continue to keys
4. Save keys
5. Continue to client key step
6. Generate key
7. Copy snippet and copy key

Expected
1. No step skipping
2. Clear statuses
3. Key card persists until page reload if state keeps it

### Script 2 Negative generate
1. Open integrations screen
2. Do not fill anything
3. Attempt to generate

Expected
1. Generate is disabled in UI
2. If forced call is made backend returns 400

### Script 3 Empty update does not erase
1. Ensure keys exist in database
2. Open screen
3. Clear fields and click update

Expected
1. Backend does not overwrite secrets with empty
2. UI still shows saved on server indicators
