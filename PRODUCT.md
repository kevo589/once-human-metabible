# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Endgame Once Human theorycrafters: min-maxers who compare loadouts, test gear, mods and food buffs against exact numbers, and plan routes for farming and bosses. They use it on PC alongside the game and on a phone as a second screen.

## Product Purpose

MetaBible is a fan-made companion for Once Human. It puts build math, curated meta builds, the world map, game data and event timers in one place, so a player can go from "what's the best build" to "where do I farm the parts" without switching sites. Success means a theorycrafter trusts its numbers and keeps it open while playing.

## Positioning

All-in-one and cross-linked. Game8, the fandom wiki and TH.GL's map each cover one slice. MetaBible connects them: a meta build loads straight into the DPS calculator, and an encyclopedia entry (a Deviation, for example) links to its spawn on the map.

## Operating Context

- Used alongside the game: alt-tabbed or on a second monitor on PC, or on a phone next to the keyboard.
- Ctrl+K global fuzzy search is the fast path to any item, mod, deviant, recipe, POI or boss.
- Saved loadouts, custom map pins and discovery tracking live in the browser (localStorage). There are no accounts.

## Capabilities and Constraints

- **DPS Calculator:** a 4-zone Gear Config loadout builder (weapons, armor, mods, Food & Cradle), with a multiplicative DPS simulation and a formula breakdown.
- **Meta Builds:** curated S+ and S tier builds, each with a Chef/Glutton food setup and anti-synergy checks.
- **Gear Workbench:** weapon and armor crafting by tier (I-V), with materials and a craft queue.
- **Interactive Map:** Nalcott Island on Leaflet with a canvas pin layer, POIs, gathering hotspots, Deviant spawns, drawings and custom markers.
- **Encyclopedia:** weapons, armor, mods (with sub-stat sets), deviations, chef recipes, encounters and specializations.
- **Event Timers:** Cargo Scramble, Public Crisis, Prime War, and daily and weekly resets, with browser alerts.
- **Stack:** React, TypeScript, Vite, Tailwind, Leaflet, Fuse.js and Zod. It is currently deployed as a static site on GitHub Pages; hosting was not confirmed as a hard constraint.
- **Must work on phones as well as desktop.** Phone use is a first-class case, not an afterthought.
- **Open decision:** whether to add a backend or accounts. None exists today.

## Brand Commitments

- The name is MetaBible, with the subtitle "Once Human Companion".
- Keep the in-game art: real item icons, crafting material images, Deviant portraits and map tiles.
- It is an unofficial fan tool. Game art and data belong to the game's publisher, so don't present it as official.

## Evidence on Hand

- Game data in `src/data/`: weapons, armor, 102 mods with sub-stat tables, 98 Deviations, recipes, encounters, food and drink buffs, and 20 meta builds.
- Map data: about 5,600 pins and 87 gathering hotspots. Map tiles and item images are in `public/`.
- There are no user testimonials, usage numbers or community endorsements. Don't invent any.

## Product Principles

1. **Numbers you can trust.** Show the math; a theorycrafter should be able to check any result.
2. **Everything links.** Every entity should lead to where it's used, where it drops and what it does to DPS.
3. **Glanceable mid-game.** Answers arrive in seconds, on a second monitor or a phone.
4. **Density without noise.** Theorycrafters want a lot of data; the work is making it scannable, not hiding it.
