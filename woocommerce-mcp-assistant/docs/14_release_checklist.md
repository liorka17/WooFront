# docs/14_release_checklist.md

# Release Checklist

## Pre release
1. Backend builds
2. Frontend builds
3. Required env vars exist
4. Database migrations applied if needed
5. Smoke tests passed

## Core smoke tests
1. GET integrations returns flags correctly
2. Update does not overwrite with empty
3. Generate rejects missing prerequisites
4. Generate reveals key only once
5. UI gating prevents skipping forward

## Post release
1. Verify logs contain no secrets
2. Verify end to end onboarding works
3. Record entry in change log and decisions log if needed
