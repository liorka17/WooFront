# docs/08_files_map.md

# Files Map

## Purpose
A map of important files and what they own.
Update this whenever you move logic or rename files.

## Backend
### Routes
1. me routes file
Purpose user integrations endpoints and client key generation rules

### Utils
1. secrets encryption utility
Purpose encrypt and decrypt WooCommerce keys at rest

### Database access
1. db client module
Purpose query execution and connection management

## Frontend
### Feature module
1. wookeys component html
Purpose step UI and forms
2. wookeys component ts
Purpose state machine and API calls
3. wookeys component scss
Purpose styling and layout

### Services
1. me api service
Purpose typed calls to me endpoints

## Plugin or widget
1. plugin integration file
Purpose consuming client key and pairing logic

## How to add a new entry
Add file path, owner responsibility, and verification note.
