# Task: auth — Real Authentication with Password Hashing

## Summary
Replaced mock authentication (any password works) with real SHA-256 salted password hashing. All 11 existing users have been seeded with the default password `password123`.

## Files Created
- `src/lib/password.ts` — `hashPassword`, `verifyPassword`, `generateOTP` using Web Crypto API
- `src/app/api/auth/register/route.ts` — POST register with email uniqueness check, password hashing, cookie set
- `src/app/api/auth/me/route.ts` — GET session validation from `sharkone-token` cookie
- `scripts/seed-passwords.ts` — one-time script to set password hashes on legacy users

## Files Modified
- `prisma/schema.prisma` — added `password String?` field to User model
- `src/app/api/auth/login/route.ts` — now verifies password hash; auto-migrates legacy users without hash; sets `sharkone-token` cookie
- `src/app/login/page.tsx` — updated demo hint and password placeholder for real auth
- `src/app/register/page.tsx` — handleSubmit now calls `/api/auth/register`, shows errors from API, added min-length validation

## Lint Status
✅ `bun run lint` passes with no errors.