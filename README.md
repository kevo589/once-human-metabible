# MetaBible — Once Human Companion

A web companion app for **Once Human** built with React, TypeScript, Vite, Tailwind CSS, Leaflet, Fuse.js, and Zod.

## Features

- **DPS & Build Calculator**: Simulates Burst DPS, Sustained DPS (with reload cycles), Crit/Weakspot scaling, Elemental/Status share, baseline comparison pinning, and `localStorage` custom loadouts.
- **Curated Meta Builds**: S+ and S endgame presets across Shrapnel, Frost Vortex, Power Surge, Unstable Bomber, Burn, and Bull's Eye with one-click calculator loading.
- **Interactive Tactical Map**: Leaflet `CRS.Simple` coordinate map for **Manibus**, **The Way of Winter**, and **Isles of Abyss** with category layer toggles, search, POI loot details, and persistent custom pins.
- **Encyclopedia & Global Search (`Ctrl+K`)**: Weapons, Armor Sets & Key Pieces, Mods, Deviations, Chef & Brews recipes, Encounters, and Memetic Specializations indexed via `fuse.js`.
- **Event & Reset Timers**: Live countdowns for Cargo Scramble, Public Crisis waves, Prime War windows, daily/weekly resets, browser alerts, and personal territory timers.

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — Start Vite dev server
- `npm run build` — Type-check with `tsc -b` and build production bundle
- `npm test` — Run Vitest unit & schema validation suite
