# docs/05_database_schema.md

# Database Schema

## Users columns used by integrations
1. store_name text nullable
2. woo_url text nullable
3. woo_ck text nullable encrypted
4. woo_cs text nullable encrypted
5. client_key_hash text nullable
6. client_key text nullable legacy transitional only if still present

## Constraints
1. client_key_hash should be unique
2. user id is primary key

## Migration notes
Add entries here when schema changes.

### Migration entry template
Date  
Change  
Why  
How to verify  
Rollback plan  
