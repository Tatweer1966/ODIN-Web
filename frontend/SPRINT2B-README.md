# JCWS Sprint 2B — Wargame Command Shell

Implemented:

- Persistent classification banner.
- Active exercise context and exercise identity.
- Simulation state, speed, turn and step controls.
- EXCON / BLUEFOR / REDFOR / WHITE CELL / Observer selector.
- Cell-aware navigation and restricted module visibility.
- Wargame lifecycle navigation: Exercise, Planning, Execution, Simulation, Analysis and System.
- Matrix, DIS and HLA connectivity indicators.
- Tactical bottom status strip.
- Wargame-focused EXCON dashboard.
- MSEL inject queue, controller action queue and simulation interoperability cards.
- Enhanced tactical map preview with friendly/hostile military-style markers.
- Existing authentication and backend API preserved.

Apply over the existing frontend, then run:

```powershell
Set-Location C:\Tatweer\ODIN-Web
npm install --workspace frontend
npm run build --workspace frontend
```

Start services:

```powershell
npm run start:dev --workspace backend
npm run dev --workspace frontend
```
