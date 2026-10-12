# Space Dodger

A small Phaser game built with JavaScript modules and Vite. This guide is
written for beginners and explains where the game starts, how a frame works,
and where to look when you want to change something.

## Run the game

1. Install Node.js if it is not already installed.
2. In a terminal opened in this project folder, run `npm install`.
3. Run `npm run dev`.
4. Open the local address printed by Vite in your browser.

To check the production build, run `npm run build`.

## Configure the Supabase leaderboard

1. Create a Supabase project and open its SQL Editor.
2. Run the SQL in `supabase/schema.sql` to create the leaderboard table and
   its public access policies.
3. Copy the project URL and anon/public key from the Supabase project settings
   into `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
4. Restart `npm run dev` after updating `.env`.

The app asks new players to choose a unique 3-16 character username (letters,
numbers, and underscores). It shows the top five active scores, saves a new
personal best to Supabase after each game, and stores the username and confirmed
high score in browser cookies.

The browser uses the Supabase anon key, which is public by design; never put a
service-role key in a `VITE_` variable. Since this version has no account
authentication, public leaderboard writes cannot prove who owns a username and
are not cheat-proof. Add Supabase Auth and bind player rows to authenticated
users before relying on scores for prizes or other trusted outcomes.

## The big picture

The browser first opens `index.html`. That page contains the buttons, score
display, and an empty `gameHolder` element. It then loads `src/main.js`.

`main.js` creates the Phaser game and starts `GameScene`. Phaser calls
`GameScene.create()` once to set the scene up, then calls `GameScene.update()`
over and over while the game is open. The scene updates the game rules and
positions; Phaser draws its objects to the canvas.

The HTML interface and Phaser canvas work together:

- HTML buttons and score boxes are updated by `ui.js`.
- The moving game objects are drawn by Phaser inside `gameHolder`.
- `GameScene` connects the game rules to both of those parts.

## Follow one game from start to finish

1. **Page loads:** `index.html` loads `src/main.js`.
2. **Game starts:** `main.js` creates Phaser and registers `GameScene`.
3. **Scene setup:** Phaser calls `create()` once. It sets initial values,
   creates the ship, background, and keyboard controls.
4. **Menu waits:** Phaser keeps calling `update()`. In menu mode, asteroids
   drift behind the menu.
5. **Player clicks Play:** `ui.js` reports the click to `main.js`, which calls
   `GameScene.startGame()`. The scene resets the score, lives, ship, and timers.
6. **Each playing frame:** `update()` calls `updatePlay()`. That method updates
   time and score, moves the ship, creates objects when timers expire, moves
   objects, and checks for collisions and pickups.
7. **The screen refreshes:** the scene draws the background and positions its
   graphics, then updates the HTML score and lives.
8. **Pause or game over:** the scene changes its `mode`; `ui.js` shows the
   matching panel. Starting again resets the game values.

## Files, in a good reading order

| File | What it is for |
| --- | --- |
| `index.html` | The page structure: buttons, score labels, overlays, and the game container. |
| `src/main.js` | The entry point: creates Phaser and connects HTML actions and keyboard shortcuts. |
| `src/js/config.js` | Game size, colors, rules, random numbers, and difficulty formulas. |
| `src/js/GameScene.js` | The game coordinator: state, frame loop, spawning, movement, collisions, and game flow. |
| `src/js/ship.js` | Ship position, keyboard/touch movement, and ship drawing call. |
| `src/js/spawn.js` | Creates asteroids, stars, and shield pickups. |
| `src/js/drawing.js` | Drawing instructions for the ship, asteroids, stars, and shield. |
| `src/js/ui.js` | Updates HTML labels and panels, and forwards button clicks. |
| `src/js/audio.js` | Sound effects. |
| `src/js/leaderboard.js` | Supabase connection, username registration, score persistence, and player cookies. |
| `supabase/schema.sql` | Leaderboard table, uniqueness constraint, and row-level security policies. |
| `src/css/style.css` | Page layout, colors, buttons, and overlays. It does not control game rules. |

## Phaser and JavaScript ideas used here

- **Scene:** A part of a Phaser game. This project has one scene,
  `GameScene`. Phaser calls its `create()` and `update()` methods for you.
- **`this.add`:** A scene helper used to create Phaser display objects, such
  as graphics and text. For example, `this.add.graphics()` creates something
  Phaser can draw.
- **`this`:** In a scene method, `this` means the current `GameScene`. The
  ship and spawn functions receive the scene so they can use `scene.add`.
- **Module imports and exports:** `export` makes a value available to another
  file; `import` brings it in. For example, `GameScene.js` imports the settings
  and helper functions it uses from `config.js`.
- **Game state:** `GameScene.mode` is one of `menu`, `play`, `pause`, or
  `over`. It tells the frame loop which behavior should run.
- **Frame time (`dt`):** `update()` receives elapsed time in milliseconds.
  The scene converts it to seconds so movement and scoring are based on time,
  rather than on how fast the computer draws frames.
- **Arrays:** `rocks`, `stars`, and `powerUps` hold the objects currently in
  the game. Each frame moves them; objects are removed when collected, hit, or
  off-screen.
- **Position:** Game coordinates start at the top-left. `x` increases to the
  right and `y` increases downward.

## Where to make common changes

- Change ship speed, starting lives, or points in `SETTINGS` in
  `src/js/config.js`.
- Change the play area in `GAME_WIDTH` and `GAME_HEIGHT` in that same file.
- Change difficulty timing in the `Difficulty` object in `config.js`.
- Change how the game behaves in `GameScene.js`.
- Change how an object looks in `drawing.js`.
- Change page appearance in `src/css/style.css`.

When learning, try changing one value at a time, save the file, and observe
the result in the browser. Vite refreshes the page when source files change.
