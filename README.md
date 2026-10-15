# Air Hockey Audio

An air hockey game made for blind and low-vision players. You play entirely by sound and touch.

## How to play

- Tap anywhere to start. A voice explains the game.
- Slide one finger left and right anywhere on the screen to move your paddle.
- **Stereo:** the puck's sound moves between your left and right ear as it moves across the table. Headphones are best.
- **Distance:** the puck gets higher in pitch and louder as it comes toward you.
- A quiet low hum always plays where your paddle is.
- Clicks and phone vibrations tell you when you hit the puck or it bounces off a wall.
- After each goal, the score is spoken. First to 7 wins.

## VoiceOver

VoiceOver catches screen touches, so turn it off while playing (triple-click the side button if you have the Accessibility Shortcut set up), then turn it back on afterwards.

## Testing on iPhone without a Mac or computer

1. Install **Expo Go** from the App Store.
2. In Safari, open snack.expo.dev and import this GitHub repository.
3. Open the Snack in Expo Go on your iPhone.

## Project files

- `App.js` is the app shell. It handles speech and vibration.
- `src/gameHtml.js` is the game itself: physics, stereo audio and touch control.
- Game settings (score to win, puck speed, paddle size, computer speed) are at the top of the game section in `src/gameHtml.js`.
