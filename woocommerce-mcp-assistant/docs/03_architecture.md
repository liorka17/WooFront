# docs/03_architecture.md

# Architecture

## Components
1. Frontend Angular application
2. Backend Fastify API server
3. Database layer
4. WordPress plugin or widget integration

## Data flow
1. Frontend calls backend endpoints under api namespace
2. Backend verifies JWT
3. Backend reads and writes database
4. Backend returns status flags used by the UI

## Key invariants
1. Secrets are encrypted before storage
2. Client key plain value is never stored
3. UI states are derived from backend flags not guesses

## Error handling model
1. Client errors return 400 with a readable error field
2. Auth errors return 401
3. Server errors return 500
