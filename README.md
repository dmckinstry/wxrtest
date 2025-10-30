# wxrtest

A 3D Rogue-like Dungeon Crawler with Smooth VR Locomotion for Meta Quest and Desktop browsers.

## Features

### Core Gameplay
- **Procedural Dungeon Generation**: Seeded random generation with 6-9 rooms per level
- **Turn-Based Combat**: Classic rogue-like tactical combat with d20 mechanics
- **Smooth Locomotion**: VR controller joystick or keyboard movement with distance-based turn advancement
- **Desktop & VR Support**: Play in VR with Meta Quest or on desktop with keyboard and mouse
- **Fog of War**: Radius-based visibility with exploration memory
- **Progressive Difficulty**: Enemy count and strength scale with dungeon depth
- **Permadeath**: Classic rogue-like permadeath with detailed statistics

### Visual Design
- **Low-Poly Aesthetics**: Flat-shaded materials for clean VR performance
- **Distinct Enemy Types**: 
  - Goblins (cubes) - Common early-game enemies
  - Skeletons (cones) - Mid-game threats from level 3+
  - Slimes (spheres) - Weak but numerous
  - Dragons (tetrahedrons) - Rare powerful foes from level 7+
- **Dynamic Lighting**: Per-room point lights that activate when explored
- **Movement Budget Indicator**: Visual ring showing remaining movement in combat mode

### Game Systems
- **Hunger System**: Decreases each turn, leading to starvation death at 0
- **Experience & Leveling**: Gain XP from kills, level up for increased stats
- **26-Slot Inventory**: Classic a-z keyed inventory system
- **Partial Item Identification**: Weapons/armor auto-identified, potions/scrolls require discovery
- **Combat Mode Detection**: Automatically enables turn-based mode when enemies are nearby (10m radius)
- **A* Pathfinding**: Intelligent enemy AI pursuing the player
- **Procedural Audio**: Web Audio API-generated sounds for all game events

### Statistics Tracking
- Turns played
- Kills
- Gold collected
- Deepest dungeon level reached
- Death type (hunger vs combat)
- Run seed for replay

## Prerequisites

- **For Desktop**: Any modern web browser (Chrome, Firefox, Edge, Safari)
- **For VR**: A WebXR-compatible browser (Meta Quest Browser, Chrome, Edge, Firefox Reality)
- For local testing: Node.js and npm (optional, for development server)

## Quick Start

### Option 1: Direct File Opening
Simply open `index.html` in a modern web browser. For desktop mode, click on the canvas to enable mouse look and use WASD keys to move. For full WebXR/VR functionality, you'll need to serve it over HTTPS or localhost.

### Option 2: Using Development Server (Recommended)

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser to `http://localhost:8080`
   - **Desktop Mode**: Click on the canvas to lock the pointer, then use WASD/Arrow keys to move and mouse to look around
   - **VR Mode**: Click "Enter VR" button if you have a WebXR-compatible headset

### Option 3: Deploy to a Web Server
Upload the files to any web server with HTTPS enabled, then access it from your desktop browser or Meta Quest browser.

## Playing on Desktop

1. Open the application in your browser
2. Click anywhere on the canvas to lock the pointer (enables mouse look)
3. Use **WASD** or **Arrow keys** to move through the dungeon
4. Move your **mouse** to look around
5. Press **ESC** to unlock the pointer and access browser controls
6. Explore, fight enemies, and try to descend as deep as possible!

## Playing on Meta Quest

1. Make sure your application is served over HTTPS (required for WebXR)
2. Open the Meta Quest Browser on your headset
3. Navigate to your application URL
4. Click the "Enter VR" button
5. Use the left controller joystick to move through the dungeon
6. Explore, fight enemies, and try to descend as deep as possible!

## Controls

### Desktop Mode
- **WASD**: Strafe movement (left/right) and forward/back
- **Arrow Keys**: 
  - **Up/Down**: Move forward/backward in facing direction
  - **Left/Right**: Rotate left/right (tank controls)
- **Mouse**: Look around (requires pointer lock - click canvas to enable)
- **ESC**: Release pointer lock
- **Movement Threshold**: Moving 2 meters advances one turn
- **Combat Mode**: Automatically activates when enemies are within 10 meters
- **HUD**: Displays HP, Hunger, Level, and Turn count
- **Action Log**: Top-left corner shows recent game events and combat messages

### VR Mode (Meta Quest)
- **Left Controller Joystick**: Move character (smooth locomotion)
- **Movement Threshold**: Moving 2 meters advances one turn
- **Combat Mode**: Automatically activates when enemies are within 10 meters
- **HUD**: Displays HP, Hunger, Level, and Turn count
- **Action Log**: Shows recent game events and combat messages

## Development

The application is built with:
- **Three.js**: 3D rendering and WebXR support
- **Custom Rogue-like Engine**: Modular game systems for dungeon crawling

### Project Structure
```
src/
  rogue/
    constants.js       - Game constants and configuration
    game-state.js      - Immutable state management
    turn-manager.js    - Turn-based mechanics
    grid-utils.js      - Spatial calculations and A* pathfinding
    dungeon-generator.js - Procedural generation with seeded RNG
    visibility.js      - Fog of war system
    render-utils.js    - 3D rendering utilities
    movement.js        - VR locomotion system
    entity-manager.js  - Enemy and item factories
    combat.js          - Combat mechanics
    inventory.js       - Item management
    audio-generator.js - Procedural audio
  game-controller.js   - Main game integration
  webxr-utils.js       - WebXR utility functions
tests/
  unit/              - Comprehensive test suite
index.html           - Main application entry point
```

### Testing

The project includes a comprehensive test suite following TDD best practices:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Test Coverage**: 192 tests covering all core systems

The test suite covers:
- Grid utilities and pathfinding
- Game state management
- Turn-based mechanics
- Dungeon generation
- Visibility and fog of war
- Movement and combat
- Inventory system
- Entity management

## Game Design

### Turn Advancement
- Player movement accumulates distance
- Each 2 meters of movement = 1 turn
- Turns consume 1 hunger point
- Enemy turns process sequentially after player turn

### Combat System
- D20-based attack rolls
- AC (Armor Class) defense
- Critical hits on natural 20 (double damage)
- Weapon and armor equipment modifies stats

### Dungeon Progression
- Each level generates 6-9 rooms
- Enemy count: floor(level * 1.5)
- Stronger enemies appear at deeper levels
- Green stairs down lead to next level

### Enemy Scaling
- Base stats increase 20% per dungeon level
- AC increases by 1 every 2 levels
- XP rewards scale with difficulty

## Browser Compatibility

### Desktop Mode
- Chrome/Chromium (recommended)
- Firefox
- Edge
- Safari
- Any modern browser with WebGL support

### VR Mode
- Meta Quest Browser (recommended for Meta Quest)
- Chrome/Edge with WebXR support
- Firefox Reality
- Other WebXR-enabled browsers

## Notes

- **Desktop Mode**: Works in any modern browser with WebGL support
- **VR Mode**: Requires HTTPS in production (localhost works for development)
- The application automatically detects WebXR support and displays appropriate UI
- In desktop mode, click the canvas to enable pointer lock for mouse look controls
- In VR mode, controllers will be tracked automatically when in VR mode
- Game uses seeded random generation for consistent dungeon layouts per seed
- Both VR and desktop modes share the same core gameplay mechanics

## License

MIT