# Air Hockey Audio — web app

This directory contains the iPhone-installable browser version. The original Expo app remains at the repository root. Work locally on branch `iphone-pwa-sites`.

## Build and verify

From `web/`, run `node build.mjs`, then `node verify-sound.mjs`. No dependencies are needed. Serve `dist/` over HTTPS for home-screen and service worker support. Included icons are reused during builds.

## Audio system

`sound-system.js` implements smoothed stereo panning, a low paddle hum, a separate midrange puck cue, high paddle-edge pulses, gentle impact notes and a shared dynamics compressor. `sound-panel.mjs` provides labeled controls, individual volumes, previews, approach mappings and browser-local persistence. `build.mjs` adapts the original gameplay snapshot in `upstream/gameHtml.mjs` and embeds the sound system and panel in the generated page. Physics and scoring remain from that snapshot. Refresh it intentionally when porting native game changes.

Headphones are recommended. Wall pulses warn about the paddle nearing a wall; puck wall collisions use short taps. Volume zero mutes each layer. Speech uses browser speech synthesis; voices can vary. Native iPhone vibration is unavailable. Private sign-in may require connectivity even when game assets are cached.

The in-app guide explains absolute horizontal touch positioning, automatic hits, angle control and VoiceOver use. Start with VoiceOver, then disable it for direct touch play.

Automated verification checks panning, approach mappings, layer and master muting, wall warnings and script syntax. Real iPhone listening, VoiceOver, offline installation and comfort testing are still required.

GitHub is a source backup, not an automatic deployment trigger. Site releases are published separately through ChatGPT Sites.
