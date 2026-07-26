# JCWS Sprint 2C.1 - Architecture Foundation

This package refactors the frontend without changing the existing authentication API or operational behavior.

## Added

- `src/app`: application bootstrap, providers, router, and module registry
- `src/core`: typed event bus, configuration, logger, and permission model
- `src/layouts`: application shell
- `src/modules`: feature-owned pages for auth, dashboard, map, and placeholders
- `src/shared`: global error boundary
- Route-level lazy loading for dashboard, map, login, and placeholder modules
- Vite vendor chunk splitting for React, OpenLayers, and i18n
- Compatibility re-exports so existing imports remain valid

## Validation

Run:

```powershell
npm run typecheck --workspace frontend
npm run build --workspace frontend
```
