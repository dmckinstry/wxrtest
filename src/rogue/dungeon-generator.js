/**
 * Procedural Dungeon Generator with Seeded RNG
 * Generates dungeons with rooms, corridors, and difficulty scaling
 */

import { 
    MIN_ROOMS, 
    MAX_ROOMS, 
    MIN_ROOM_SIZE, 
    MAX_ROOM_SIZE,
    ENEMY_SCALE_FACTOR,
    ENEMY_TYPES
} from './constants.js';

/**
 * Seeded Random Number Generator (Mulberry32)
 */
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }

    next() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }

    choice(array) {
        return array[this.nextInt(0, array.length - 1)];
    }
}

/**
 * Rectangle class for rooms
 */
class Room {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    get center() {
        return {
            x: Math.floor(this.x + this.width / 2),
            y: Math.floor(this.y + this.height / 2)
        };
    }

    intersects(other) {
        return (
            this.x <= other.x + other.width &&
            this.x + this.width >= other.x &&
            this.y <= other.y + other.height &&
            this.y + this.height >= other.y
        );
    }
}

/**
 * Generate a dungeon level
 * @param {number} seed - Random seed
 * @param {number} level - Dungeon level (for difficulty scaling)
 * @param {number} width - Grid width
 * @param {number} height - Grid height
 * @returns {object} Dungeon data {grid, rooms, stairsPosition, enemySpawns}
 */
export function generateDungeon(seed, level = 1, width = 40, height = 40) {
    const rng = new SeededRandom(seed);
    
    // Initialize grid with walls
    const grid = Array(height).fill(null).map(() => Array(width).fill('wall'));
    
    // Generate rooms
    const rooms = [];
    const numRooms = rng.nextInt(MIN_ROOMS, MAX_ROOMS);
    
    for (let i = 0; i < numRooms; i++) {
        const roomWidth = rng.nextInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
        const roomHeight = rng.nextInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
        const x = rng.nextInt(1, width - roomWidth - 1);
        const y = rng.nextInt(1, height - roomHeight - 1);
        
        const newRoom = new Room(x, y, roomWidth, roomHeight);
        
        // Check if room intersects with existing rooms
        let intersects = false;
        for (const room of rooms) {
            if (newRoom.intersects(room)) {
                intersects = true;
                break;
            }
        }
        
        if (!intersects) {
            createRoom(grid, newRoom);
            
            // Connect to previous room with corridor
            if (rooms.length > 0) {
                const prevRoom = rooms[rooms.length - 1];
                createCorridor(grid, prevRoom.center, newRoom.center, rng);
            }
            
            rooms.push(newRoom);
        }
    }
    
    // Place stairs down in the last room
    const lastRoom = rooms[rooms.length - 1];
    const stairsPosition = {
        x: lastRoom.center.x,
        y: lastRoom.center.y
    };
    grid[stairsPosition.y][stairsPosition.x] = 'stairs_down';
    
    // Calculate enemy spawns based on level
    const enemyCount = Math.floor(level * ENEMY_SCALE_FACTOR);
    const enemySpawns = generateEnemySpawns(rng, rooms, enemyCount, level, stairsPosition);
    
    return {
        grid,
        rooms,
        stairsPosition,
        enemySpawns,
        width,
        height
    };
}

/**
 * Create a room by carving out floor tiles
 * @param {Array<Array>} grid - 2D grid array
 * @param {Room} room - Room to create
 */
function createRoom(grid, room) {
    for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
            grid[y][x] = 'floor';
        }
    }
}

/**
 * Create a corridor between two points
 * @param {Array<Array>} grid - 2D grid array
 * @param {object} start - Start position {x, y}
 * @param {object} end - End position {x, y}
 * @param {SeededRandom} rng - Random number generator
 */
function createCorridor(grid, start, end, rng) {
    let x = start.x;
    let y = start.y;
    
    // Randomly choose to go horizontal first or vertical first
    if (rng.next() > 0.5) {
        // Horizontal then vertical
        while (x !== end.x) {
            grid[y][x] = 'floor';
            x += x < end.x ? 1 : -1;
        }
        while (y !== end.y) {
            grid[y][x] = 'floor';
            y += y < end.y ? 1 : -1;
        }
    } else {
        // Vertical then horizontal
        while (y !== end.y) {
            grid[y][x] = 'floor';
            y += y < end.y ? 1 : -1;
        }
        while (x !== end.x) {
            grid[y][x] = 'floor';
            x += x < end.x ? 1 : -1;
        }
    }
    grid[y][x] = 'floor';
}

/**
 * Generate enemy spawn positions
 * @param {SeededRandom} rng - Random number generator
 * @param {Array<Room>} rooms - List of rooms
 * @param {number} count - Number of enemies to spawn
 * @param {number} level - Dungeon level
 * @param {object} stairsPosition - Stairs position to avoid
 * @returns {Array<object>} Enemy spawn data
 */
function generateEnemySpawns(rng, rooms, count, level, stairsPosition) {
    const spawns = [];
    const availableTypes = getAvailableEnemyTypes(level);
    
    // Skip first room (player spawn)
    const spawnRooms = rooms.slice(1, -1); // Also skip last room (stairs)
    
    if (spawnRooms.length === 0) {
        return spawns;
    }
    
    for (let i = 0; i < count; i++) {
        const room = rng.choice(spawnRooms);
        const position = {
            x: rng.nextInt(room.x + 1, room.x + room.width - 2),
            y: rng.nextInt(room.y + 1, room.y + room.height - 2)
        };
        
        // Don't spawn on stairs
        if (position.x === stairsPosition.x && position.y === stairsPosition.y) {
            continue;
        }
        
        const enemyType = selectEnemyType(rng, availableTypes, level);
        
        spawns.push({
            type: enemyType,
            position,
            level: level
        });
    }
    
    return spawns;
}

/**
 * Get enemy types available at this dungeon level
 * @param {number} level - Dungeon level
 * @returns {Array<string>} Available enemy type names
 */
function getAvailableEnemyTypes(level) {
    const available = [];
    
    for (const [typeName, config] of Object.entries(ENEMY_TYPES)) {
        if (level >= config.spawnDepth) {
            available.push(typeName);
        }
    }
    
    return available.length > 0 ? available : ['GOBLIN']; // Fallback to GOBLIN
}

/**
 * Select an enemy type based on spawn weights
 * @param {SeededRandom} rng - Random number generator
 * @param {Array<string>} availableTypes - Available enemy types
 * @param {number} level - Dungeon level for scaling
 * @returns {string} Selected enemy type name
 */
function selectEnemyType(rng, availableTypes, level) {
    const weights = availableTypes.map(type => ENEMY_TYPES[type].spawnWeight);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    let random = rng.nextFloat(0, totalWeight);
    
    for (let i = 0; i < availableTypes.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return availableTypes[i];
        }
    }
    
    return availableTypes[availableTypes.length - 1];
}

/**
 * Get player starting position (center of first room)
 * @param {object} dungeon - Dungeon data
 * @returns {object} Position {x, y}
 */
export function getPlayerStartPosition(dungeon) {
    if (dungeon.rooms.length === 0) {
        return { x: 1, y: 1 };
    }
    return dungeon.rooms[0].center;
}

/**
 * Export SeededRandom for testing
 */
export { SeededRandom };
