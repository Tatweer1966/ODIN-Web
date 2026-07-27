# JCWS DevKit 1.0.0 - Milestone 2

## Quality gate

```powershell
npm install
npm run check
```

## Commands

```powershell
node dist\index.js --cwd C:\Tatweer\ODIN-Web doctor
node dist\index.js --cwd C:\Tatweer\ODIN-Web workspace
node dist\index.js --cwd C:\Tatweer\ODIN-Web backup frontend\src\App.tsx frontend\src\locales\en\navigation.json
node dist\index.js restore C:\Tatweer\ODIN-Web\.jcws-backups\<id>\manifest.json
node dist\index.js --cwd C:\Tatweer\ODIN-Web clean --keep 30
```

Workspace reports are written to `reports/workspace.json` and `reports/workspace.md`.
