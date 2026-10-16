# Air Hockey Audio — accessible web test

The web version lives under `web/` on the GitHub branch `iphone-pwa-sites`. The original Expo app remains at the repository root. Pull that branch to work locally.

From `web/`, run `node build.mjs` then `node verify-sound.mjs`. No packages are required. Serve `dist/` using an HTTPS host for installation and service worker support; localhost can be used for development.

## Sound library and interface

The default kit uses a rhythmic click for the puck, a low continuous paddle hum, inharmonic metallic wall clanks, wooden player hits, low computer drums, high edge chirps, rounded serve beeps and harp goal melodies. There are 36 selectable textures across eight roles, with separate volumes for all roles and speech. The wall collision and paddle-edge warnings have separate sound assignments and volume controls. Clicks speed up as the puck approaches; pitch/loudness mappings remain adjustable.

The main menu exposes Start game, Sound settings, How to play and Install. Each sound group keeps its choice, test, stop, volume slider and increment buttons together. Native details elements expose expanded/collapsed state. Menu changes focus the selected heading. Inputs use explicit labels and unique ids. Settings use browser-local storage `air-hockey-sound-v2`, introducing the new distinct default kit without reusing the previous similar tone assignments.

`sound-system.js` contains synthesis and settings behavior; `sound-panel.mjs` contains role-specific presets and grouped controls. `build.mjs` embeds these into the original gameplay snapshot in `upstream/gameHtml.mjs`. The Expo app does not receive these web-only adaptations automatically. Gameplay physics and scoring are unchanged.

Automated checks cover default cues, panning, approach modes, muting, every selectable impact/serve/goal sound, idle silence, syntax, form labels and menu ids. Real iPhone VoiceOver navigation and headphone comfort still need user testing. Stereo panning is not a promise of exact physical localization. iPhone web vibration is unavailable.

GitHub holds source backups. Site publication happens separately through ChatGPT Sites; GitHub pushes do not automatically deploy.
