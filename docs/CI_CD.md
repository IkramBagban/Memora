# CI/CD

This repository uses GitHub Actions for CI and CD to Expo (OTA updates) and EAS Android APK builds.

## Workflow

File: .github/workflows/expo-ci-cd.yml

- CI (all PRs to main, and pushes to main)
  - Installs dependencies with npm install
  - Runs npm run lint
  - Runs npm run typecheck

- CD - OTA Update (push to main and manual dispatch)
  - Runs after CI passes
  - Authenticates with Expo using EXPO_TOKEN
  - Publishes OTA update:
    - npx eas update --branch production --non-interactive

- CD - Android APK Build (push to main and manual dispatch)
  - Runs after CI passes
  - Triggers EAS Android preview build profile (APK)
  - Writes latest build details link in GitHub Actions Step Summary

## Required GitHub Secrets

Add these in repository settings:

- EXPO_TOKEN
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY

## How to create EXPO_TOKEN

1. Sign in locally: npx expo login
2. Create token: npx expo token:create
3. Save token as EXPO_TOKEN in GitHub secrets

## Important

- Expo Go uses OTA updates (no APK install needed).
- APK installs come from EAS Build internal/preview builds.
- If you want direct APK installs for users, use the EAS build link from workflow summary.
