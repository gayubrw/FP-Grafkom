# Space Corridor Game

A 3D endless runner game built with Three.js where players navigate through a dark corridor, avoiding obstacles and trying to achieve the highest score.

## Features

- 3D graphics powered by Three.js
- Endless runner gameplay
- Three-lane movement system
- Obstacle avoidance mechanics
- Score tracking with high score system
- Dynamic lighting and shadow effects
- Responsive design

## Controls

- Left Arrow (←): Move left
- Right Arrow (→): Move right
- Spacebar: Jump

## Tech Stack

- Three.js for 3D graphics
- JavaScript (ES6+)
- HTML5
- CSS3
- Vite as the build tool

## Project Structure

```
space-corridor/
│
├── src/
│   ├── assets/
│   │   ├── models/
│   │   ├── textures/
│   │   └── audio/
│   │
│   ├── styles/
│   │   └── main.css
│   │
│   └── js/
│       ├── main.js
│       │
│       ├── game/
│       │   ├── Game.js
│       │   ├── Player.js
│       │   ├── Obstacle.js
│       │   └── ScoreManager.js
│       │
│       ├── utils/
│       │   ├── Controls.js
│       │   └── Collision.js
│       │
│       └── ui/
│           ├── Menu.js
│           └── HUD.js
│
├── index.html
├── package.json
└── vite.config.js
```

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd space-corridor
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Gameplay

- Navigate through a corridor
- Avoid obstacles by moving left, right, or jumping
- Score increases as you progress
- Game ends when hitting an obstacle
- Try to beat your high score!

## Development

The game is built using modern JavaScript and follows an object-oriented approach:

- `Game.js`: Main game logic and scene setup
- `Player.js`: Player character controls and physics
- `Obstacle.js`: Obstacle generation and movement
- `ScoreManager.js`: Score tracking and high score management
- `Controls.js`: Input handling
- `Collision.js`: Collision detection system

## Credits

- Font: [Orbitron](https://fonts.google.com/specimen/Orbitron) from Google Fonts
- 3D Graphics: Three.js
- Build Tool: Vite

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Feel free to contribute to this project by submitting issues or pull requests!
