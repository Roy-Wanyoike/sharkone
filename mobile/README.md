# SHARKONE Mobile App

> **Status:** Placeholder — React Native mobile app not yet started.

This directory is reserved for the future SHARKONE React Native mobile application.

## Planned Stack

- **Framework:** React Native (Expo)
- **Language:** TypeScript
- **State Management:** Zustand (shared patterns with the web app)
- **Navigation:** Expo Router
- **API:** Same backend API as the web app (`/api/*` routes)

## Relationship to Web App

The mobile app will consume the same REST API served by the Next.js backend at `src/app/api/`. No changes to the API layer are needed — the mobile app is purely a new client.

## Getting Started (When Ready)

```bash
cd mobile
npm install
npx expo start
```
