# Air Hockey Audio — accessible web test

The web version lives under `web/` on the GitHub branch `iphone-pwa-sites`. The original Expo app remains at the repository root. Pull that branch to work locally.

From `web/`, run `node build.mjs` then `node verify-sound.mjs`. No packages are required. Serve `dist/` using an HTTPS host for installation and service worker support; localhost can be used for development.

## Sound library and interface

The default kit uses a rhythmic click for the puck, a low continuous paddle hum, inharmonic metallic wall clanks, wooden player hits, low computer drums, high edge chirps, rounded serve beeps and harp goal melodies. There are 36 selectable textures across eight roles, with separate volumes for all roles and speech. The wall collision and paddle-edge warnings have separate sound assignments and volume controls. Clicks speed up as the puck approaches; pitch/loudness mappings remain adjustable.

The main menu exposes Start game, Sound settings, How to play and Install. Each sound group keeps its choice, test, stop, volume slider and increment buttons together. Native details elements expose expanded/collapsed state. Menu changes focus the selected heading. Inputs use explicit labels and unique ids. Settings use browser-local storage `air-hockey-sound-v2`, introducing the new distinct default kit without reusing the previous similar tone assignments.

`sound-system.js` contains synthesis and settings behavior; `sound-panel.mjs` contains role-specific presets and grouped controls. `build.mjs` embeds these into the original gameplay snapshot in `upstream/gameHtml.mjs`. The Expo app does not receive these web-only adaptations automatically. Gameplay physics and scoring are unchanged.

Automated checks cover default cues, panning, approach modes, muting, every selectable impact/serve/goal sound, idle silence, syntax, form labels and menu ids. Real iPhone VoiceOver navigation and headphone comfort still need user testing. Stereo panning is not a promise of exact physical localization. iPhone web vibration is unavailable.

GitHub holds source backups. Site publication happens separately through ChatGPT Sites; GitHub pushes do not automatically deploy.

## Game narrator and VoiceOver controls

Enable game voice or Start game activates browser speech. Safari requires interaction; the website does not guarantee speech immediately on opening and cannot switch system VoiceOver off. Game voice and controls offers the device-provided speech voice list, speed, optional menu narration, and a saved control method. Menu narration defaults off to avoid duplicate VoiceOver announcements.

VoiceOver controls are the default: an adjustable Paddle position range input and Move left, Center, Move right buttons. Direct touch is an optional mode for play with VoiceOver disabled. Browser interaction speed and actual playability still require testing on iPhone. The first serve waits for the narrator introduction to end, with error and timeout fallback. Run `node verify-voice.mjs` to check narrator selection, persistence, input controls and touch guards.

## Talking interface, with iPhone VoiceOver off

Activate Start talking interface once with VoiceOver, listen for the welcome, then turn iPhone VoiceOver off yourself. Safari requires user interaction to unlock speech; the page does not automatically disable VoiceOver or guarantee speech on opening.

Custom menu gestures: one-finger swipe right/left selects next/previous and reads the item; double tap anywhere activates the selected button or expands a group; swipe up/down adjusts the selected slider or choice; single tap repeats the selection; two-finger tap goes back. The virtual cursor includes headings and help paragraphs as well as controls, skipping hidden/disabled items. The active item is outlined visually. Menu changes select the new screen heading.

During gameplay, one finger controls the paddle directly. A two-finger tap pauses and switches to spoken game controls; another two-finger tap resumes. At game over, Play again is available. Exit talking interface restores the prior paddle control mode. Navigation speech has its own 10–100 percent volume, independent of game muting. Settings, presets and voice choices retain the same grouped menu controls.

`talking-interface.js` implements the virtual cursor and gesture routing. `node verify-talking.mjs` checks navigation, adjustments, activation, double taps, gameplay touch passthrough, pause/resume and exit. Real-device gesture conflicts, speech timing and ease of use still require iPhone testing.

## Automatic internal screen reader

The talking interface now initializes on every page opening without an enable button. The first swipe or tap announces Start game using the saved narrator, naturally satisfying Safari's user-interaction requirement. It cannot guarantee speech before any interaction or disable the system screen reader. The initial gesture does not skip Start game; subsequent swipes navigate normally. Exit affects only the current session; opening the app again starts internal routing automatically. Trusted native control activations remain available; compatibility clicks following intercepted touch gestures are suppressed to avoid activating the wrong item.
