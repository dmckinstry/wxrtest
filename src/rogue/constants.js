/**
 * Game Constants for 3D Rogue-like Dungeon Crawler
 */

// Grid and spatial constants
export const TILE_SIZE = 2; // 2 meters per tile
export const VISIBILITY_RADIUS = 5; // 5 meters visibility radius
export const MOVEMENT_THRESHOLD = 2; // 2 meters to advance turn
export const COMBAT_DETECTION_RADIUS = 10; // 10 meters for auto-combat mode

// Target tile highlighting
export const TARGET_PREVIEW_SCALE = 20; // Scale factor for target preview calculation

// Attraction effect constants
export const MIN_ATTRACTED_ENEMIES = 2; // Minimum enemies spawned by attraction
export const MAX_ATTRACTED_ENEMIES_RANGE = 3; // Range added to min (2-4 total)
export const MIN_SPAWN_DISTANCE = 3; // Minimum distance in tiles from player
export const SPAWN_DISTANCE_RANGE = 4; // Range added to min distance

// Color palette for low-poly flat-shaded aesthetics - vibrant and colorful
export const PALETTE = {
    // Environment - bright and colorful
    FLOOR: 0x8B7355,      // Sandy brown floor
    WALL: 0x6B8E23,       // Olive green walls
    DOOR: 0xD2691E,       // Chocolate brown door
    STAIRS_DOWN: 0x00ff00,
    STAIRS_UP: 0x00ffff,
    
    // Visibility
    VISIBLE: 0xffffff,
    EXPLORED: 0x5C4033,   // Darker brown for explored areas (still visible)
    HIDDEN: 0x000000,
    
    // UI
    HUD_BG: 0x000000,
    HUD_TEXT: 0x00ff00,
    HEALTH_FULL: 0x00ff00,
    HEALTH_MID: 0xffff00,
    HEALTH_LOW: 0xff0000,
    HUNGER_NORMAL: 0x00ff00,
    HUNGER_HUNGRY: 0xffaa00,
    HUNGER_STARVING: 0xff0000,
    
    // Entities
    PLAYER: 0x4169E1,     // Royal blue player
    
    // Enemies - bright and distinct colors
    GOBLIN: 0xFF6347,     // Tomato red
    SKELETON: 0xF0E68C,   // Khaki/bone yellow
    SLIME: 0x32CD32,      // Lime green
    DRAGON: 0xFF4500,     // Orange red
    TROLL: 0x8B4513,      // Saddle brown
    KOBOLD: 0xDDA0DD,     // Plum
    THUG: 0x696969,       // Dim gray
    GOLEM: 0x708090,      // Slate gray
    GIANT_SPIDER: 0x800080, // Purple
    RAT: 0x8B7355,        // Brown
    
    // Items
    POTION: 0xFF00FF,     // Magenta
    SCROLL: 0xFFD700,     // Gold
    SWORD: 0xC0C0C0,      // Silver
    RING: 0xFF8C00,       // Dark orange
    GOLD: 0xFFD700,       // Gold
    FOOD: 0xFFA500        // Orange
};

// Enemy type configurations
export const ENEMY_TYPES = {
    GOBLIN: {
        name: 'Goblin',
        color: PALETTE.GOBLIN,
        geometry: 'box', // BoxGeometry(0.8, 0.8, 0.8)
        size: [0.8, 0.8, 0.8],
        baseHP: 10,
        baseAC: 12,
        baseDamage: [1, 6], // 1d6
        xpValue: 50,
        spawnDepth: 1, // Can spawn from level 1
        spawnWeight: 10 // Higher weight = more common
    },
    SKELETON: {
        name: 'Skeleton',
        color: PALETTE.SKELETON,
        geometry: 'cone', // ConeGeometry(0.5, 1.5, 6)
        size: [0.5, 1.5, 6],
        baseHP: 15,
        baseAC: 13,
        baseDamage: [1, 8], // 1d8
        xpValue: 100,
        spawnDepth: 3, // Spawns from level 3+
        spawnWeight: 7
    },
    SLIME: {
        name: 'Slime',
        color: PALETTE.SLIME,
        geometry: 'sphere', // SphereGeometry(0.6, 8, 6)
        size: [0.6, 8, 6],
        baseHP: 8,
        baseAC: 10,
        baseDamage: [1, 4], // 1d4
        xpValue: 30,
        spawnDepth: 1,
        spawnWeight: 8
    },
    DRAGON: {
        name: 'Dragon',
        color: PALETTE.DRAGON,
        geometry: 'tetrahedron', // TetrahedronGeometry(1.0)
        size: [1.0],
        baseHP: 50,
        baseAC: 18,
        baseDamage: [3, 6], // 3d6
        xpValue: 500,
        spawnDepth: 7, // Spawns from level 7+
        spawnWeight: 2
    },
    RAT: {
        name: 'Rat',
        color: PALETTE.RAT,
        geometry: 'box', // BoxGeometry(0.5, 0.3, 0.5)
        size: [0.5, 0.3, 0.5],
        baseHP: 5,
        baseAC: 10,
        baseDamage: [1, 3], // 1d3
        xpValue: 10,
        spawnDepth: 1,
        spawnWeight: 12 // Very common at low levels
    },
    KOBOLD: {
        name: 'Kobold',
        color: PALETTE.KOBOLD,
        geometry: 'cone', // ConeGeometry(0.4, 1.0, 6)
        size: [0.4, 1.0, 6],
        baseHP: 7,
        baseAC: 11,
        baseDamage: [1, 4], // 1d4
        xpValue: 25,
        spawnDepth: 1,
        spawnWeight: 11 // Prolific at low levels
    },
    TROLL: {
        name: 'Troll',
        color: PALETTE.TROLL,
        geometry: 'box', // BoxGeometry(1.2, 1.5, 1.2)
        size: [1.2, 1.5, 1.2],
        baseHP: 25,
        baseAC: 14,
        baseDamage: [2, 6], // 2d6
        xpValue: 200,
        spawnDepth: 4, // Mid-levels
        spawnWeight: 6,
        regenerates: true // Special: regenerates 1HP per turn
    },
    THUG: {
        name: 'Thug',
        color: PALETTE.THUG,
        geometry: 'box', // BoxGeometry(0.9, 1.4, 0.9)
        size: [0.9, 1.4, 0.9],
        baseHP: 18,
        baseAC: 13,
        baseDamage: [1, 8], // 1d8
        xpValue: 120,
        spawnDepth: 3,
        spawnWeight: 8
    },
    GOLEM: {
        name: 'Golem',
        color: PALETTE.GOLEM,
        geometry: 'box', // BoxGeometry(1.0, 1.8, 1.0)
        size: [1.0, 1.8, 1.0],
        baseHP: 35,
        baseAC: 16,
        baseDamage: [2, 8], // 2d8
        xpValue: 300,
        spawnDepth: 5,
        spawnWeight: 5
    },
    GIANT_SPIDER: {
        name: 'Giant Spider',
        color: PALETTE.GIANT_SPIDER,
        geometry: 'sphere', // SphereGeometry(0.7, 8, 6)
        size: [0.7, 8, 6],
        baseHP: 12,
        baseAC: 12,
        baseDamage: [1, 6], // 1d6 plus potential poison
        xpValue: 75,
        spawnDepth: 2,
        spawnWeight: 7
    }
};

// Game progression constants
export const HUNGER_RATE = 1; // Hunger decreases by 1 per turn
export const STARTING_HUNGER = 1000;
export const STARTING_HP = 20;
export const STARTING_LEVEL = 1;
export const XP_PER_LEVEL = 100;
export const XP_MULTIPLIER = 1.5; // XP needed increases by 1.5x per level

// Dungeon generation constants
export const MIN_ROOMS = 6;
export const MAX_ROOMS = 9;
export const MIN_ROOM_SIZE = 3;
export const MAX_ROOM_SIZE = 8;
export const ENEMY_SCALE_FACTOR = 1.5; // floor(level * 1.5) enemies per level

// Inventory constants
export const INVENTORY_SIZE = 26; // a-z slots
export const ITEM_TYPES = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    POTION: 'potion',
    SCROLL: 'scroll',
    RING: 'ring',
    GOLD: 'gold',
    FOOD: 'food'
};

// Material properties for low-poly aesthetics
export const MATERIAL_PROPS = {
    flatShading: true,
    roughness: 0.9,
    metalness: 0.1
};

// Turn-based mechanics
export const TURN_ACTIONS = {
    MOVE: 'move',
    ATTACK: 'attack',
    USE_ITEM: 'use_item',
    PICKUP: 'pickup',
    DESCEND: 'descend',
    WAIT: 'wait'
};
