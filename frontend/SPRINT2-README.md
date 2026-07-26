# JCWS Sprint 2A — Wargaming Identity & Secure Access

This package begins the transition from ODIN to **JCWS — Joint Command & Wargaming System**.

## Implemented

- Rebuilt bilingual English/Arabic login experience.
- Wargaming-first product language and capability statements.
- Egyptian-inspired JCWS emblem used as the login watermark and identity mark.
- Responsive desktop/tablet/mobile layout.
- Password visibility control.
- Secure-access and audit notice.
- Product title changed to JCWS.
- Sidebar identity changed to JCWS / Wargaming System.
- Current exercise label changed to Joint Exercise 01.
- Existing JWT authentication and backend API flow preserved.

## Apply

1. Stop the frontend dev server.
2. Back up `C:\Tatweer\ODIN-Web\frontend`.
3. Replace the frontend contents with this package.
4. Run:

```powershell
Set-Location C:\Tatweer\ODIN-Web
npm install --workspace frontend
npm run build --workspace frontend
npm run dev --workspace frontend
```

Backend:

```powershell
npm run start:dev --workspace backend
```

## Next increment

Sprint 2B will establish the full wargame application shell:

- Active exercise context
- Simulation clock and turn controls
- EXCON / BLUEFOR / REDFOR / WHITE CELL context
- Classification banner
- Wargame lifecycle navigation
- Role-aware module visibility
- Tactical design tokens and reusable components
