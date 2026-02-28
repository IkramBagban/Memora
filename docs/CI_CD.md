# CI/CD

This repository uses GitHub Actions for CI and CD to Expo.

## Workflow

File: `.github/workflows/expo-ci-cd.yml`

- **CI (all PRs to `main`, and pushes to `main`)**
  - Installs dependencies with `npm ci`
  - Runs `npm run lint`
  - Runs `npm run typecheck`

- **CD (push to `main` and manual dispatch)**
  - Runs after CI passes
  - Authenticates with Expo using `EXPO_TOKEN`
  - Publishes an OTA update using EAS:
    - `eas update --branch production --non-interactive`

## Required GitHub Secrets

Add these in your GitHub repository settings:

- `EXPO_TOKEN`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## How to create EXPO_TOKEN

1. Sign in to Expo locally: `npx expo login`
2. Create token: `npx expo token:create`
3. Copy token value into GitHub secret `EXPO_TOKEN`

## Notes

- This CD pipeline publishes **OTA updates** to Expo branch `production`.
- App binaries are not built/submitted in this workflow.
- If you need store build/release automation too, add EAS build + submit jobs.
