# docs/04_backend_api_contract.md

# Backend API Contract

## Response envelope
Recommended shape
1. ok boolean
2. data object when ok is true
3. error string when ok is false

## GET me integrations
Method GET  
Path /api/me/integrations  
Auth required yes  

Returns data
1. store_name string
2. woo_url string
3. has_woo_ck boolean
4. has_woo_cs boolean
5. has_client_key_hash boolean
6. client_key string only if legacy transitional value exists

Validation expectations
1. Unauthorized returns 401
2. Missing user returns 404

## PUT me integrations
Method PUT  
Path /api/me/integrations  
Auth required yes  

Body
1. store_name optional
2. woo_url optional
3. woo_ck optional
4. woo_cs optional

Rules
1. Empty strings must not erase existing values
2. Secrets must be encrypted before writing
3. Server should return updated flags has_woo_ck and has_woo_cs

Returns
1. ok true
2. data optional with updated flags

## POST me client key
Method POST  
Path /api/me/client_key  
Auth required yes  

Rules
1. Must reject if woo_url is missing in database
2. Must reject if woo_ck is missing in database
3. Must reject if woo_cs is missing in database
4. If client_key_hash exists then must not return plain key
5. If regeneration is supported then require an explicit parameter and log it

Returns
1. ok true and client_key plain only once
2. store_url optional for UI convenience

## Smoke tests
1. Generate without prerequisites must return 400
2. Generate after update with real stored values must return 200
3. Generate again must not return the key
