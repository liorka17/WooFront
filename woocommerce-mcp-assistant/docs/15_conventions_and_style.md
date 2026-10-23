# docs/15_conventions_and_style.md

# Conventions and Style

## Documentation conventions
1. Keep docs short and verifiable
2. Prefer checklists and scripts over long explanations
3. Every change should have a change log entry
4. Every non obvious decision should have a decisions log entry

## API conventions
1. Use ok boolean
2. Use error string on failures
3. Do not leak secrets

## Frontend conventions
1. Step state is explicit
2. Step gating enforced in UI
3. Readiness driven by backend flags
4. Toast for short feedback, banner for blocking issues

## Backend conventions
1. Auth enforced with preHandler
2. Validate user id and database row existence
3. Enforce prerequisites on server side
