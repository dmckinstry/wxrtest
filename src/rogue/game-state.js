/**
 * Game State Management
 * Immutable state management for the rogue-like game
 */

import { STARTING_HUNGER, STARTING_HP, STARTING_LEVEL, INVENTORY_SIZE } from './constants.js';

/**
 * Create initial game state
 * @param {number} seed - Random seed for dungeon generation
 * @returns {object} Initial game state
 */
export function createInitialState(seed = Date.now()) {
    return {
        // Run information
        seed: seed,
        turnCount: 0,
        
        // Player stats
        player: {
            position: { x: 0, y: 0 }, // Grid position
            worldPosition: { x: 0, y: 1.6, z: 0 }, // 3D world position (y=1.6 for VR head height)
            rotation: 0, // Player yaw rotation in radians
            hp: STARTING_HP,
            maxHp: STARTING_HP,
            hunger: STARTING_HUNGER,
            maxHunger: STARTING_HUNGER,
            level: STARTING_LEVEL,
            xp: 0,
            xpToNext: 100,
            ac: 10, // Armor class
            attackBonus: 0,
            damageBonus: 0,
            weapon: null,
            armor: null
        },
        
        // Dungeon state
        dungeon: {
            level: 1,
            grid: [],
            rooms: [],
            stairsPosition: null
        },
        
        // Entity tracking
        entities: {
            enemies: [],
            items: []
        },
        
        // Exploration and visibility
        exploredTiles: new Set(), // Set of "x,y" strings
        visibleTiles: new Set(),
        
        // Combat and turn state
        inCombatMode: false,
        accumulatedMovement: 0,
        
        // Inventory
        inventory: Array(INVENTORY_SIZE).fill(null),
        
        // Statistics for death screen
        statistics: {
            kills: 0,
            goldCollected: 0,
            deepestLevel: 1,
            itemsUsed: 0,
            hungerDeaths: 0,
            combatDeaths: 0,
            turnsPlayed: 0
        },
        
        // Game flow
        gameOver: false,
        victory: false,
        deathMessage: ''
    };
}

/**
 * Update player position
 * @param {object} state - Current game state
 * @param {object} position - New position {x, y} in grid coordinates
 * @returns {object} New state
 */
export function updatePlayerPosition(state, position) {
    return {
        ...state,
        player: {
            ...state.player,
            position: { ...position }
        }
    };
}

/**
 * Update player world position (3D coordinates)
 * @param {object} state - Current game state
 * @param {object} worldPosition - New position {x, y, z} in world coordinates
 * @returns {object} New state
 */
export function updatePlayerWorldPosition(state, worldPosition) {
    return {
        ...state,
        player: {
            ...state.player,
            worldPosition: { ...worldPosition }
        }
    };
}

/**
 * Update player rotation
 * @param {object} state - Current game state
 * @param {number} rotation - New rotation in radians
 * @returns {object} New state
 */
export function updatePlayerRotation(state, rotation) {
    return {
        ...state,
        player: {
            ...state.player,
            rotation: rotation
        }
    };
}

/**
 * Decrease player hunger
 * @param {object} state - Current game state
 * @param {number} amount - Amount to decrease
 * @returns {object} New state
 */
export function decreaseHunger(state, amount = 1) {
    const newHunger = Math.max(0, state.player.hunger - amount);
    
    let newState = {
        ...state,
        player: {
            ...state.player,
            hunger: newHunger
        }
    };
    
    // Check for starvation
    if (newHunger === 0 && !state.gameOver) {
        newState = {
            ...newState,
            gameOver: true,
            deathMessage: 'You starved to death!',
            statistics: {
                ...newState.statistics,
                hungerDeaths: newState.statistics.hungerDeaths + 1
            }
        };
    }
    
    return newState;
}

/**
 * Deal damage to player
 * @param {object} state - Current game state
 * @param {number} damage - Damage amount
 * @returns {object} New state
 */
export function damagePlayer(state, damage) {
    const newHp = Math.max(0, state.player.hp - damage);
    
    let newState = {
        ...state,
        player: {
            ...state.player,
            hp: newHp
        }
    };
    
    // Check for death
    if (newHp === 0 && !state.gameOver) {
        newState = {
            ...newState,
            gameOver: true,
            deathMessage: 'You were slain in combat!',
            statistics: {
                ...newState.statistics,
                combatDeaths: newState.statistics.combatDeaths + 1
            }
        };
    }
    
    return newState;
}

/**
 * Heal player
 * @param {object} state - Current game state
 * @param {number} amount - Heal amount
 * @returns {object} New state
 */
export function healPlayer(state, amount) {
    return {
        ...state,
        player: {
            ...state.player,
            hp: Math.min(state.player.maxHp, state.player.hp + amount)
        }
    };
}

/**
 * Add experience points
 * @param {object} state - Current game state
 * @param {number} xp - XP amount to add
 * @returns {object} New state
 */
export function addExperience(state, xp) {
    let newXp = state.player.xp + xp;
    let newLevel = state.player.level;
    let newMaxHp = state.player.maxHp;
    let newHp = state.player.hp;
    let newXpToNext = state.player.xpToNext;
    let newAttackBonus = state.player.attackBonus;
    
    // Check for level up
    while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel++;
        newMaxHp += 5; // Gain 5 HP per level
        newHp += 5; // Heal 5 HP on level up
        newAttackBonus++; // +1 to hit per level
        newXpToNext = Math.floor(newXpToNext * 1.5); // 50% more XP needed for next level
    }
    
    return {
        ...state,
        player: {
            ...state.player,
            xp: newXp,
            level: newLevel,
            maxHp: newMaxHp,
            hp: Math.min(newHp, newMaxHp),
            xpToNext: newXpToNext,
            attackBonus: newAttackBonus
        }
    };
}

/**
 * Increment turn counter
 * @param {object} state - Current game state
 * @returns {object} New state
 */
export function incrementTurn(state) {
    return {
        ...state,
        turnCount: state.turnCount + 1,
        statistics: {
            ...state.statistics,
            turnsPlayed: state.statistics.turnsPlayed + 1
        }
    };
}

/**
 * Set combat mode
 * @param {object} state - Current game state
 * @param {boolean} inCombat - Whether in combat mode
 * @returns {object} New state
 */
export function setCombatMode(state, inCombat) {
    return {
        ...state,
        inCombatMode: inCombat
    };
}

/**
 * Update accumulated movement
 * @param {object} state - Current game state
 * @param {number} distance - Distance moved
 * @returns {object} New state
 */
export function updateAccumulatedMovement(state, distance) {
    return {
        ...state,
        accumulatedMovement: state.accumulatedMovement + distance
    };
}

/**
 * Reset accumulated movement
 * @param {object} state - Current game state
 * @returns {object} New state
 */
export function resetAccumulatedMovement(state) {
    return {
        ...state,
        accumulatedMovement: 0
    };
}

/**
 * Increment kill counter
 * @param {object} state - Current game state
 * @returns {object} New state
 */
export function incrementKills(state) {
    return {
        ...state,
        statistics: {
            ...state.statistics,
            kills: state.statistics.kills + 1
        }
    };
}

/**
 * Add gold
 * @param {object} state - Current game state
 * @param {number} amount - Gold amount
 * @returns {object} New state
 */
export function addGold(state, amount) {
    return {
        ...state,
        statistics: {
            ...state.statistics,
            goldCollected: state.statistics.goldCollected + amount
        }
    };
}

/**
 * Add item to player inventory
 * @param {object} state - Current game state
 * @param {object} item - Item to add
 * @returns {object} New state with success flag
 */
export function addItemToInventory(state, item) {
    // Validate inventory exists
    if (!state.inventory || !Array.isArray(state.inventory)) {
        return {
            ...state,
            success: false,
            slot: null
        };
    }
    
    // Find first empty slot
    for (let i = 0; i < state.inventory.length; i++) {
        if (state.inventory[i] === null) {
            const newInventory = [...state.inventory];
            newInventory[i] = item;
            return {
                ...state,
                inventory: newInventory,
                success: true,
                slot: i
            };
        }
    }
    
    // Inventory full
    return {
        ...state,
        success: false,
        slot: null
    };
}

/**
 * Remove item from world
 * @param {object} state - Current game state
 * @param {string} itemId - Item ID to remove
 * @returns {object} New state
 */
export function removeItemFromWorld(state, itemId) {
    return {
        ...state,
        entities: {
            ...state.entities,
            items: state.entities.items.filter(item => item.id !== itemId)
        }
    };
}
