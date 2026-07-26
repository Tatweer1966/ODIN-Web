# ODIN Web V3 - Frontend Sprint 1

This package standardizes the frontend on TypeScript and activates the C2 command shell.

## Included

- TypeScript-only React entry point
- Duplicate JSX/JavaScript implementation removed
- UTF-8-safe English/Arabic translation context
- RTL/LTR switching
- JWT login and `/auth/me` session validation
- Legacy token-key migration
- Operational command dashboard
- Responsive sidebar and command bar
- Design tokens and reusable panel/status styling
- TypeScript and Vite configuration

## Apply on Windows

1. Stop `npm run dev`.
2. Back up `C:\Tatweer\ODIN-Web\frontend`.
3. Replace the frontend files with the contents of this package.
4. From `C:\Tatweer\ODIN-Web`, run:

```powershell
npm install --workspace frontend
npm run build --workspace frontend
npm run dev
```

5. Open `http://localhost:5173` and hard-refresh with `Ctrl+F5`.

The API base URL defaults to `http://localhost:4100/api`. Override it with `VITE_API_URL` when required.
