# docs/10_deployment_and_env.md

# Deployment and Environment

## Environments
1. Local development
2. Staging
3. Production

## Required env variables
List your actual variables here and what each one does.

Example entries
1. CLIENT_KEY_PEPPER
Purpose HMAC hashing for client key hash

2. Encryption secret material for secretsCrypto
Purpose encrypt WooCommerce keys

## Operational checks
1. Backend boots successfully only when required env variables exist
2. Database connectivity is verified
3. Auth middleware works

## Rollout steps
1. Merge to main
2. Build backend
3. Run smoke tests
4. Build frontend
5. Deploy
6. Verify integrations flow end to end
