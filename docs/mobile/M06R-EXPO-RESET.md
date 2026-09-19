# M06R — Expo foundation reset

**Date:** 2026-09-19  
**Base:** `fa13a64e507b90b25008e0274d42615b84ac9678` (main tip; current code wins)  
**Decision:** Replace dual-native Swift/Kotlin with **one** Expo + React Native + TypeScript + Expo Router app.

## Why

PR #233 planned Expo. PR #234 preserved product/API/security/Mobbin research and briefly selected native. PR #235 started Swift + Kotlin M06. Dual clients duplicate every feature, CI job, and permission/error path. EvoCRM already has a React + TypeScript web shop; `/api/v1` is the backend contract.

## What M06R is

Production-grade **foundation only**:

- Expo SDK 57 workspace at `mobile/`
- Typed `/api/v1` client with error mapping
- Auth state machine + SecureStore
- Workspace isolation + permission parse
- Tab placeholders + deep-link / push / camera / share seams
- Linux CI + EAS config

No CRM feature screens. No M07 UX.

## What M06R is not

- Not a merge of PR #235
- Not a deletion of PR #235
- Not an Expo overlay on the #235 branch
- Not a restart of M00–M05 research
- Not App Store credential setup

## Stack versions (verified)

Official Expo SDK reference (latest at implementation): https://docs.expo.dev/versions/latest/

| Package | Version in `mobile/package.json` |
|---|---|
| `expo` | ~57.0.24 |
| `react-native` | 0.86.3 |
| `react` | 19.2.3 |
| `expo-router` | ~57.0.22 |
| `typescript` | ~6.0.3 |
| `expo-secure-store` | ~57.0.4 |
| `jest-expo` | ~57.0.5 |

Do not copy older SDK pins from PR #233 planning text.

## PR #235

Leave `feat/mobile-m06-native-foundation` open. Use it as a historical map of API fixtures, error kinds, and IA. Do not add Expo files there.
