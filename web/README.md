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

## Gameplay startup audio repair

The short ready message now has a four-second fallback instead of waiting up to twenty seconds for browser speech callbacks. Starting the serve resumes an interrupted audio context. Clicking puck transients have a slightly longer, louder envelope for audibility. No start/enable/resume voice button appears on opening; automatic internal routing remains active. Optional recovery to internal navigation is available inside voice/control settings after choosing standard browser controls.

Run `node verify-game-start.mjs` for the compiled-app regression: simulate missing speech callbacks and interrupted audio, advance frames, verify a moving puck plus generated serve, puck, metallic wall and hit voices. This is simulated verification; real iPhone audio output still needs user testing.

## Real-table audio update

Recorded table impacts now come from krb21's CC0 `air hockey smack.WAV` Freesound preview. See `assets/SOUND-CREDITS.md` for the source, license and edits. Three compact 22.05 kHz PCM excerpts are embedded synchronously into the built page via `assets/table-hits.json`, so playback needs no external request or asynchronous decoder. `realistic-audio.js` supplies recorded-impact playback, a looped filtered-air bed and a low fan motor. The rail texture layers a bright recorded impact with a brief inharmonic metallic clink. Existing directional puck clicks remain the tracking cue.

Table airflow has its own preset, test, stop and volume controls. It is quiet by default and can be muted separately. Default wood/drum/metal selections migrate to the recorded/recorded-low/rail kit once; other custom selections are preserved. A procedural fallback remains if recorded buffers cannot initialize. `node verify-realistic.mjs` verifies sample bounds, initialization, playback, looping, muting and preview cleanup. Real iPhone listening still needs user verification.

## Portrait, stereo clarity and player-operated serves

The table is displayed upright: computer at the top, human at the bottom/charging-port end. Puck display coordinates map `screenY = 1 - puck.y`; paddle touches map against the table's horizontal bounds. The manifest requests portrait-primary. Orientation locking is attempted where supported; landscape gameplay pauses and asks the player to rotate upright before resuming. Safari need not honor an orientation lock, so no CSS rotation is used to swap left and right.

Focused stereo expands off-center panning while keeping the center equal in both ears and the extremes fully isolated. Natural stereo remains selectable. Left wall = one metallic impact, full left; right wall = two, full right. Player impact = one sharper recorded strike; computer impact = two low knocks by default. Incoming puck ticks use a brighter double pattern; outgoing ticks use a lower single pattern. Patterns and stereo strength are adjustable in the Puck and Walls sound groups. Existing default-like settings migrate once; custom nondefault volumes and sound selections are retained. Airflow and the paddle hum are quieter, and airflow reduces further as the puck approaches the human goal.

The Headphone and direction check page supplies isolated left/right tones plus wall and paddle tests. If isolated channel tests are heard equally in both ears, check system Mono Audio, stereo balance and headphone processing. The app cannot inspect or override iPhone audio accessibility settings.

Start game now speaks Three, Two, One, Puck is dropped, without the startup instruction prompt. Optional configurable countdown backing notes remain independently adjustable. The puck rests at the human end with zero velocity. Touch to place it horizontally, then flick upward at least 28 CSS pixels to strike toward the computer. Place/Strike buttons provide a standard-control alternative. Every rally, including after a computer goal, returns to this human-operated serve. Speech end events do not control countdown progression. The game resumes audio after the drop and on placement/strike gestures.

`player-serve.js` handles countdown and manual serving. `portrait-table.js` and `.mjs` handle orientation, table display and headphone-check content. `node verify-game-start.mjs` tests countdown timing without speech callbacks, stationary possession, touch placement, upward strikes and possession after an opponent goal. `node verify-portrait.mjs` tests court coordinates, touch bounds and landscape pausing. `verify-sound.mjs` also covers stronger pan values, differing wall patterns and incoming/outgoing tick voices. Actual iPhone sound localization and gesture comfort remain for user testing.
