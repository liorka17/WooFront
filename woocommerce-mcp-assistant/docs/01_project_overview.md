# docs/01_project_overview.md

# Project Overview

## What this product is
Write a one paragraph description of what the product does and who it serves.

## Primary user value
1. Connect a WooCommerce store
2. Save WooCommerce credentials safely
3. Generate a client key for plugin or widget pairing
4. Provide a guided onboarding that reduces confusion

## Core user journey
1. User signs in
2. User enters store details
3. User provides WooCommerce keys
4. System validates readiness using real backend flags
5. User generates client key
6. User installs plugin snippet and confirms it works

## Non negotiable requirements
1. No secret is stored in plain text
2. No client key plain value is persisted
3. Backend enforces prerequisites even if UI fails
4. UI prevents premature actions via step gating
