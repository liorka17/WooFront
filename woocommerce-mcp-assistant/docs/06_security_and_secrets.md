# docs/06_security_and_secrets.md

# Security and Secrets

## Goals
1. Prevent credential leakage
2. Keep database safe at rest
3. Ensure backend enforces security regardless of UI

## Rules
1. Never store WooCommerce keys as plain text
2. Encrypt woo_ck and woo_cs before database write
3. Never store client key plain value
4. Store only client_key_hash
5. Use a server side pepper from environment for HMAC hashing
6. Do not return secrets to frontend

## Environment variables
1. CLIENT_KEY_PEPPER required to hash client keys
2. Encryption key material required for secret encryption utility

## Logging rules
1. Never log woo_ck or woo_cs plain values
2. Never log client key plain values
3. Log only boolean readiness states and masked identifiers

## Threat model notes
1. Database leak should not reveal WooCommerce keys
2. Network sniffing should be blocked by TLS
3. Frontend must not have access to secrets
