# docs/11_troubleshooting.md

# Troubleshooting

## Generate works without entering anything
Likely cause
Backend generate endpoint does not enforce prerequisites based on database stored values

Fix
Enforce database checks on woo_url woo_ck woo_cs before generating

## User can skip steps
Likely cause
Step navigation is clickable without gating

Fix
Disable direct step clicking or allow only when prior steps are satisfied

## Update saves even when form is empty
Likely cause
Frontend does not validate and backend updates with empty strings

Fix
Frontend blocks update when required fields are missing
Backend treats empty strings as null and does not overwrite

## Show button is too far from input
Likely cause
Layout places button outside input line

Fix
Wrap input and button in a single flex row with tight gap and consistent height
