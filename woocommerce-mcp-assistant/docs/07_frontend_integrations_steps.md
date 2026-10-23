# docs/07_frontend_integrations_steps.md

# Frontend Integrations Steps

## Goal
A three step onboarding that feels like a SaaS setup, prevents skipping forward, and shows real statuses.

## Steps
Step 1 Store details  
Step 2 WooCommerce keys  
Step 3 Client key and installation

## Step gating rules
1. User starts at step 1 always
2. User can move to step 2 only when step 1 is valid
3. User can move to step 3 only when step 2 is valid and saved
4. Generate is enabled only when backend flags confirm readiness

## Status model
UI should display a small status for each step.
Examples of status terms
1. Not connected
2. Keys missing
3. Ready to generate
4. Key generated

## Feedback model
1. Banner reserved for blocking errors or system state
2. Toast used for quick actions such as saved copied generated
3. Avoid duplicate success messages

## Input UX requirements
1. Show and hide toggle aligned next to the input
2. Saved on server indicator near label when backend says it exists
3. Inline error under the field
4. Help text such as leave empty to keep existing when appropriate
