---
version: 1
slug: "src-components-map-interactivemapview-tsx"
primary_target: "src/components/map/InteractiveMapView.tsx"
related_targets: ["src/App.tsx","src/components/layout/Sidebar.tsx"]
---

# Surface: App shell + Interactive Map

Mode: Operate. Audience: endgame theorycrafters, mid-session on a PC second monitor or a phone. Job: find what to farm or fight on Nalcott, filter thousands of pins, and jump from a pin to everything else MetaBible knows about it. Constraints: dark (night play), keep the in-game art and map tiles, no data hidden behind extra clicks, no slower path to an answer, phones first-class. Other views keep their content this round and only inherit the shell, ground and type.

## Direction contract

THESIS: Every feature is a transit line and every pin is a station with transfers. This refuses the category default of a navy sidebar, a cyan accent and an anonymous popup.

OWN-WORLD: Signage black (#000) bands on a near-black ground (#0b0c0d), sign white (#f2f2ee) type in Archivo. Each feature owns a route colour: DPS orange #f2762e, Builds red #e2332e, Workbench yellow #f7c319, Map green #2fa36b, Encyclopedia blue #1e6fd9, Timers purple #9b5fc0. Round route bullets with a letter, 3px white rules under sign bands, small radii, and no glass.

STORY: A player sees at once which line they're on, toggles layers as stops on a line, picks a pin, and reads it like a station sign. The sign's Transfers row takes them straight to that thing's encyclopedia entry, builds or calculator.

FIRST VIEWPORT: A 64px black band holds the wordmark, six route bullets with labels (the active bullet is ringed white) and the Ctrl+K search. Below it the map fills the screen. The layer legend sits left as stops on a coloured line; off layers show a dashed ring. A selected pin opens a docked station sign on the right (a bottom sheet on phones): white header band with type and name, data rows, then Transfers as route bullets.

FORM: Night Transit Signage, #6 of 7 on my grounded list (Unimark / Vignelli wayfinding). seed:2621b9864df98a8d. Raises: state by shape and line form, not hue alone (emission rail); the map owns the screen and panels yield to it (zoo map); entity cards share one fixed scale (botanical folio); reflow by whole cells (Crouwel).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: Transfers. A pin's station sign lists every other MetaBible destination for the same entity as route bullets, and one tap goes there. Motion grammar: the station sign slides in along one axis (from the right on desktop, from the bottom on phones) with an exponential ease-out; nothing else animates.
