---
name: MetaBible
description: Once Human companion, signed like a night transit system.
colors:
  sign-black: "#000000"
  sign-ground: "#0b0c0d"
  sign-panel: "#111213"
  sign-raised: "#18191a"
  sign-seam: "#2a2b2c"
  sign-dim: "#8a8b87"
  sign-mute: "#a8a9a4"
  sign-white: "#f2f2ee"
  sign-subline: "#3a3b38"
  line-dps: "#f2762e"
  line-builds: "#e2332e"
  line-workbench: "#f7c319"
  line-map: "#2fa36b"
  line-enc: "#3b82f6"
  line-timers: "#a26bd1"
typography:
  display:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.43
    fontFeature: "\"tnum\" 1"
  body-dense:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
  readout:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  readout-compact:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  label:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "0.12em"
rounded:
  sm: "2px"
  md: "6px"
  full: "9999px"
spacing:
  gutter: "12px"
  sign-pad: "16px"
  row: "8px"
  band-h-phone: "56px"
  band-h-desktop: "64px"
components:
  sign-band:
    backgroundColor: "{colors.sign-black}"
    textColor: "{colors.sign-white}"
    height: "{spacing.band-h-desktop}"
    padding: "0 24px"
  route-bullet:
    textColor: "{colors.sign-black}"
    rounded: "{rounded.full}"
    size: "34px"
    typography: "{typography.title}"
  route-bullet-sm:
    textColor: "{colors.sign-black}"
    rounded: "{rounded.full}"
    size: "28px"
  button-sign-outline:
    backgroundColor: "{colors.sign-black}"
    textColor: "{colors.sign-white}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 12px"
  button-sign-outline-hover:
    backgroundColor: "{colors.sign-white}"
    textColor: "{colors.sign-black}"
  button-seam:
    textColor: "{colors.sign-mute}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 12px"
  button-line-filled:
    backgroundColor: "{colors.line-map}"
    textColor: "{colors.sign-black}"
    rounded: "{rounded.md}"
    height: "40px"
  station-sign-header:
    backgroundColor: "{colors.sign-white}"
    textColor: "{colors.sign-black}"
    typography: "{typography.display}"
    padding: "14px 16px"
  station-sign:
    backgroundColor: "{colors.sign-black}"
    textColor: "{colors.sign-white}"
    rounded: "{rounded.md}"
    width: "360px"
  chip-outline:
    textColor: "{colors.sign-mute}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 12px"
  chip-outline-active:
    backgroundColor: "{colors.sign-white}"
    textColor: "{colors.sign-black}"
  input-field:
    backgroundColor: "{colors.sign-raised}"
    textColor: "{colors.sign-white}"
    rounded: "{rounded.md}"
    padding: "6px 8px"
  badge-new:
    backgroundColor: "{colors.sign-white}"
    textColor: "{colors.sign-black}"
    rounded: "{rounded.sm}"
    padding: "2px 4px"
---

# Design System: MetaBible

## Overview

**Creative North Star: "Night Transit Signage"**

Every feature is a transit line and every map pin is a station with transfers. The interface reads like Unimark-era wayfinding seen at night: pure black sign bands on a near-black ground, warm sign-white type set in Archivo, and one saturated route colour per feature. Colour names a place, never decorates it.

The world is dense but legible at a glance, because it is used alt-tabbed beside the game and on a phone as a second screen. The map owns the screen and panels yield to it: the legend docks left, the station sign docks right (a bottom sheet on phones), and both stay narrow. State is carried by shape and line form, not hue alone: a solid ring is on, a dashed ring is off, a white ring is selected.

Depth is almost absent. Sign surfaces are flat black, separated by 3px sign-white rules and 1px seams. The one motion in the world is the station sign sliding in along a single axis.

**Key Characteristics:**
- Black sign bands with a 3px sign-white rule beneath or above them.
- Six route colours, one per feature line, used as the ring of each route bullet.
- Station-sign reading order: white header band, data rows, then Transfers.
- State by form (solid, dashed, ringed), never by colour alone.
- Small radii (2px and 6px) plus full circles for bullets and stops; no glass, no gradients on sign surfaces.

**Migration status.** The system is shipped on the app shell (top sign band), the Interactive Map and the DPS calculator. The Meta Builds, Workbench, Encyclopedia and Timers views have not been restyled. They inherit the retuned neutral blacks through the legacy `obsidian.*` scale but still carry the previous world's accents (`stardust`, `anomaly`, `crimson`). Those views are pending migration and are not part of this system.

## Colors

A neutral black-and-white sign palette with six route colours as the only chroma.

### Primary
- **Sign White** (sign-white): all primary type on black, the 3px rules under sign bands, the station sign header band, the selection ring, focus outlines and text selection. It is the system's main voice; the route colours are secondary to it.

### Secondary: the route lines
Each feature owns exactly one route colour, shared by its nav bullet and any Transfer that points to it.
- **Signal Orange** (line-dps): DPS calculator, in-game turret icon. On its own line it is the accent: a 2px ring on the active weapon slot, slider accents, and the marks on selected bonus options.
- **Signal Red** (line-builds): Meta Builds, in-game booster icon.
- **Signal Yellow** (line-workbench): Gear Workbench, in-game gear workbench icon.
- **Route Green** (line-map): Interactive Map, in-game map-pin icon. Also the line the layer legend's stops sit on, the filled "Discovered" button, and focus borders on map-panel inputs.
- **Route Blue** (line-enc): Encyclopedia, in-game book icon.
- **Route Purple** (line-timers): Event Timers, in-game alarm icon.

### Neutral
- **Sign Black** (sign-black): sign bands, the station sign body, popups, tooltips, the black gap inside the selection ring.
- **Night Ground** (sign-ground): page background, Leaflet canvas, the legend panel, scrollbar track.
- **Panel** (sign-panel) and **Raised** (sign-raised): inset fields, tool groups and grouped controls inside panels.
- **Seam** (sign-seam): 1px dividers between data rows, panel borders, outlined secondary buttons.
- **Mute** (sign-mute): row labels, section labels, inactive nav labels, secondary values.
- **Dim** (sign-dim): tertiary text, hidden-layer labels, placeholders, the tagline under the wordmark.
- **Sub-line Grey** (sign-subline): the type and region line inside the white station-sign header only.

### Named Rules
**The One Line Per Feature Rule.** A route colour means its feature and nothing else. Never use a line colour as a general accent outside its own feature; Route Green is allowed across the map because the map is the Map line.

**The Game Icon Rule.** Icons come from the game, never from a generic icon set: route bullets, legend stops, map pins and the station-sign header use the in-game icon from `src/data/gameIcons.tsx` (sheet via TH.GL, credited in the map attribution). A category with no verified game icon keeps its drawn glyph rather than borrowing a wrong one.

## Typography

**Display Font:** Archivo (self-hosted variable woff2, weights 100-900, with Helvetica Neue, Arial)
**Body Font:** Archivo
**Label/Mono Font:** Archivo for labels and numbers. JetBrains Mono is still declared in the Tailwind config for pending views and is not part of this system; restyled surfaces (the calculator included) set numbers in Archivo tabular figures, never mono.

**Character:** One grotesque in many weights, as on a transit sign: extra-bold names, semibold labels, plain data. Tabular figures are on globally so coordinates, counts and drop chances align.

### Hierarchy
- **Display** (800, 22px, tight leading, -0.015em, balanced wrap): station sign title and the wordmark (19px on phones). Black on white in the sign header, white on black in the band.
- **Title** (600, 15px): nav labels and Transfer rows.
- **Body** (400, 14px): data rows, drop lists, button text (buttons at 600).
- **Body Dense** (500 or 600 when active, 13px): legend entries and panel controls.
- **Readout** (800, 34px, leading 1, -0.02em): the headline numbers of a feature, such as Sustained and Burst DPS, each under a Label and over a 13px semibold delta. A 22px compact cut runs in the phone sticky bar.
- **Label** (600, 12px, 0.12em tracking, uppercase): section headers that sit on a rule, such as "Transfers", "Drops per open" and legend group titles. They label a block of rows; they never float above a headline.

### Named Rules
**The Tabular Rule.** Numbers are always tabular (set on `body`); never switch a data surface to proportional figures.

## Layout

A fixed sign band sits at the top: 56px on phones, 64px from 768px (the `--band-h` custom property), sticky, holding the wordmark, six route bullets and the Ctrl K search. Below it the map fills the remaining screen. Overlays float inside the map with a 12px gutter: the layer legend docks left (328px, max 88vw), the station sign docks right on desktop (360px, starting 60px from the top) and becomes a bottom sheet capped at 62% height on phones. Inside panels, padding is 16px horizontally; data rows are 8px top and bottom with a seam underneath. Tap targets are at least 36px (legend stops), 40px (buttons) and 44px (Transfer rows). The nav reflows by whole cells: inactive labels appear from 1024px, the active label from 768px, bullets are always visible.

**Character screen (DPS calculator).** Two equal columns from 1024px with a 32px gap (24px below): equipment on the left, sticky 16px under the band, and the character sheet on the right, opened by the Readout over a 3px sign-white rule. Below 1024px the sheet follows the grid and the Readout moves into a sticky black bar directly under the band (compact 22px Readout, 1px seam beneath). The stat sheet flows across CSS columns: one column, two from 640px, 32px apart, with rows and headings kept unbroken.

**Layering.** The sign band is sticky at z-40; the phone DPS bar sits at z-30 under it; app modal overlays and toasts are z-50, above the band.

### Named Rules
**The Map Owns the Screen Rule.** Panels are narrow, docked and dismissible. Nothing permanently covers the map's centre.

**The Modals Over the Band Rule.** The band never outranks a modal: keep the band at z-40 and overlays at z-50. A band raised above that (the old z-[1500]) renders modals underneath it.

## Elevation & Depth

Flat by default. Sign surfaces sit on the ground with no shadow; separation comes from black against near-black, 1px seams and 3px sign-white rules. The few shadows that exist are dark and ambient, used only where a surface floats over the map imagery.

### Shadow Vocabulary
- **Map popup** (`box-shadow: 0 12px 28px rgba(0,0,0,0.78)`): Leaflet popups over the map.
- **Legend panel** (`box-shadow: 8px 0 24px rgba(0,0,0,0.5)`): the docked layer legend's edge.
- **Floating control** (`box-shadow: 0 4px 14px rgba(0,0,0,0.6)`): the collapsed legend's reopen button.

### Named Rules
**The White Rule Rule.** A sign band is closed by a 3px sign-white rule: under the top band, along the top of the phone station sign, and above the Transfers block. Use the 3px rule for sign structure and the 1px seam for rows; never mix the two roles.

## Shapes

Small, firm corners: 2px for glyph tiles, close buttons and badges; 6px for buttons, inputs, panels and the station sign. Full circles are reserved for route bullets, legend stops and map pins. The scrollbar thumb is square. Rings carry state: a 3px solid ring is a shown layer, a 3px dashed ring at reduced opacity is a hidden one, and a selected pin gets a 3px black gap then a 3px sign-white ring, independent of its category hue.

## Components

### Sign Band (navigation)
The top band is pure black with a 3px sign-white rule beneath. Each feature is a button holding its route bullet; the active one is ringed 2px sign-white with a 2px black offset and shows its label in sign-white, inactive labels are mute and turn white on hover. A small sign-white dot with a black border on the Timers bullet signals live events. Search is a 40px seam-outlined button that turns its border white on hover.

### Route Bullet (signature)
A 2px ring in the line colour around a black disc holding the feature's in-game icon: 32px on phones and 36px on desktop in the band, 28px in Transfer rows. The same bullet means the same feature everywhere.

### Station Sign (signature)
A selected pin reads like a station sign. A sign-white header band carries the pin's glyph or image on a black tile, its extra-bold name, and a sub-line of type, region and place. Below: a primary action row, data rows (mute label left, semibold white value right, seam beneath), an optional drop table, then the Transfers block behind a 3px white rule, listing every other page for the same entity as route-bullet rows with a trailing arrow. It slides in once along one axis (24px from the right on desktop, from below on phones; 260ms, `cubic-bezier(0.16, 1, 0.3, 1)`), and does not animate under reduced motion.

### Outline Chips
- **Style:** 36px tall, 6px radius, 2px seam border, 13px semibold mute text; hover turns border and text sign-white.
- **Active:** fills sign-white with black text and a sign-white border.
- **Use:** one chip for tabs, toggles (Weapon 1 / 2), target chips and toolbar buttons, so every switch on a surface looks the same.

### Stat Sheet Rows (expandable)
A 14px row: mute label left (white on hover), bold value right, 1px seam beneath. A row with sources ends in a dim chevron cue and expands in place into a 13px source list on sign-panel (mute source left, semibold signed value right); the chevron flips while open. A row without sources reserves the chevron's width and shows no chevron, so values stay aligned. Section headings inside the sheet are Labels.

### Gear Slot Cards
Weapon and armor slots keep the game's rarity card gradients (legendary amber, epic purple, rare blue, common slate) as content art, a deliberate exception to the flat ground. The item name always shows. The active weapon slot carries the 2px Signal Orange ring.

### Buttons
- **Shape:** gently squared (6px), 40px tall, 14px semibold.
- **Sign outline:** 2px sign-white border on black; hover inverts to white fill with black text.
- **Seam outline:** 2px seam border, mute text; hover turns border and text white.
- **Line filled:** route-colour fill with black text, used for a confirmed state (Discovered on the Map line).
- **Focus:** 2px sign-white outline, 2px offset, everywhere.

### Layer Legend (stops on a line)
Each layer group is a 4px Route Green line with layers as 17px stops on it. A stop is a black disc with a 3px ring in the category's colour, solid when shown and dashed at 70% opacity when hidden; the label goes semibold white when shown and dim when hidden. Counts sit right in mute; a "New" badge is a sign-white block with black uppercase text.

### Inputs / Fields
- **Style:** raised or black fill, 1px seam border, 6px radius, 13px text, dim placeholder.
- **Focus:** border shifts to Route Green inside map panels.

### Map Pins
Round pins in their category colour; hover scales 1.15 to 1.18, selection scales 1.25 with the black-gap white ring, discovered pins drop to about 35% opacity.

## Do's and Don'ts

### Do:
- **Do** give every new feature surface its route colour and in-game icon from the nav lines, and reach it from Transfers with the same bullet.
- **Do** close sign bands with a 3px sign-white rule and separate rows with 1px seams.
- **Do** show state by form: solid ring on, dashed ring off, white ring selected.
- **Do** keep route-bullet letters black on every line colour.
- **Do** keep the station sign's order: white header band, data rows, Transfers.
- **Do** keep motion to the station sign's single-axis slide, and disable it under reduced motion.
- **Do** use one outline chip for every tab, toggle and toolbar switch on a surface.
- **Do** keep the sign band at z-40 and modal overlays at z-50.

### Don't:
- **Don't** use a route colour as decoration or as an accent outside its own feature.
- **Don't** use glass, backdrop blur or gradients on sign surfaces. The game's rarity card art on gear slots is content, not a sign surface.
- **Don't** signal state with hue alone.
- **Don't** add radii beyond 2px and 6px except full circles for bullets, stops and pins.
- **Don't** let a panel cover the centre of the map permanently.
- **Don't** port the pending views' cyan, amber and rose accents (`stardust`, `anomaly`, `crimson`) into restyled surfaces.
