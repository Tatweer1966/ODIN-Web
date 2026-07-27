# JCWS DevKit 1.0.0 — Milestone 1

Clean foundation release for ODIN-Web / JCWS.

## Included

- strict TypeScript project
- Commander-based CLI
- Zod configuration validation
- Pino logger factory
- JSON and Markdown report writers
- Vitest unit tests
- ESLint and Prettier quality gates
- tsup executable build

## Commands

```powershell
npm install
npm run check
node dist/index.js version
node dist/index.js config
node dist/index.js doctor
```

## Installation into ODIN-Web

Delete the old mixed package first:

```powershell
Remove-Item -Recurse -Force C:\Tatweer\ODIN-Web\tools\jcws-devkit
```

Copy this clean `tools\jcws-devkit` directory into the repository, then run:

```powershell
cd C:\Tatweer\ODIN-Web\tools\jcws-devkit
npm install
npm run check
```

Do not copy this release over the legacy v0.2/v0.3 directory without deleting it first.
