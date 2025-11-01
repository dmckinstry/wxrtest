/**
 * Entity Manager
 * Factory functions for creating game entities (enemies, items)
 */

import { ENEMY_TYPES, ITEM_TYPES } from './constants.js';

/**
 * Create an enemy entity
 * @param {string} type - Enemy type name (from ENEMY_TYPES)
 * @param {object} position - Grid position {x, y}
 * @param {number} dungeonLevel - Current dungeon level for scaling
 * @returns {object} Enemy entity
 */
export function createEnemy(type, position, dungeonLevel = 1) {
    const config = ENEMY_TYPES[type];
    
    if (!config) {
        throw new Error(`Unknown enemy type: ${type}`);
    }
    
    // Scale stats with dungeon level
    const levelMultiplier = 1 + (dungeonLevel - 1) * 0.2; // 20% increase per level
    
    return {
        id: `enemy_${Date.now()}_${Math.random()}`,
        type: type,
        name: config.name,
        position: { ...position },
        hp: Math.floor(config.baseHP * levelMultiplier),
        maxHp: Math.floor(config.baseHP * levelMultiplier),
        ac: config.baseAC + Math.floor(dungeonLevel / 2),
        damage: [...config.baseDamage],
        xpValue: Math.floor(config.xpValue * levelMultiplier),
        geometry: config.geometry,
        size: config.size,
        color: config.color,
        isAlive: true,
        lastAction: null
    };
}

/**
 * Create a weapon item
 * @param {string} name - Weapon name
 * @param {Array<number>} damage - Damage dice [count, sides]
 * @param {number} bonus - Attack bonus
 * @returns {object} Weapon item
 */
export function createWeapon(name, damage, bonus = 0) {
    return {
        id: `weapon_${Date.now()}_${Math.random()}`,
        type: ITEM_TYPES.WEAPON,
        name: name,
        damage: damage,
        bonus: bonus,
        identified: true // Weapons are auto-identified
    };
}

/**
 * Create an armor item
 * @param {string} name - Armor name
 * @param {number} acBonus - AC bonus
 * @returns {object} Armor item
 */
export function createArmor(name, acBonus) {
    return {
        id: `armor_${Date.now()}_${Math.random()}`,
        type: ITEM_TYPES.ARMOR,
        name: name,
        acBonus: acBonus,
        identified: true // Armor is auto-identified
    };
}

/**
 * Create a potion item
 * @param {string} trueType - True potion type (e.g., 'healing', 'strength')
 * @param {string} appearance - Appearance name (e.g., 'red potion')
 * @param {object} effect - Effect function or data
 * @returns {object} Potion item
 */
export function createPotion(trueType, appearance, effect) {
    return {
        id: `potion_${Date.now()}_${Math.random()}`,
        type: ITEM_TYPES.POTION,
        trueType: trueType,
        appearance: appearance,
        effect: effect,
        identified: false // Potions start unidentified
    };
}

/**
 * Create a scroll item
 * @param {string} trueType - True scroll type (e.g., 'teleport', 'identify')
 * @param {string} appearance - Appearance name (e.g., 'dusty scroll')
 * @param {object} effect - Effect function or data
 * @returns {object} Scroll item
 */
export function createScroll(trueType, appearance, effect) {
    return {
        id: `scroll_${Date.now()}_${Math.random()}`,
        type: ITEM_TYPES.SCROLL,
        trueType: trueType,
        appearance: appearance,
        effect: effect,
        identified: false // Scrolls start unidentified
    };
}

/**
 * Create a gold pile
 * @param {number} amount - Amount of gold
 * @returns {object} Gold item
 */
export function createGold(amount) {
    return {
        id: `gold_${Date.now()}_${Math.random()}`,
        type: ITEM_TYPES.GOLD,
        amount: amount,
        identified: true
    };
}

/**
 * Create a food item
 * @param {string} name - Food name (e.g., 'ration', 'apple', 'bread')
 * @param {number} hungerRestore - Amount of hunger restored
 * @returns {object} Food item
 */
export function createFood(name, hungerRestore = 100) {
    return {
        id: `food_${Date.now()}_${Math.random()}`,
        type: ITEM_TYPES.FOOD,
        name: name,
        hungerRestore: hungerRestore,
        identified: true
    };
}

/**
 * Identify an item
 * @param {object} item - Item to identify
 * @returns {object} Identified item
 */
export function identifyItem(item) {
    return {
        ...item,
        identified: true
    };
}

/**
 * Get display name for item
 * @param {object} item - Item
 * @returns {string} Display name
 */
export function getItemDisplayName(item) {
    if (item.identified || item.type === ITEM_TYPES.WEAPON || 
        item.type === ITEM_TYPES.ARMOR || item.type === ITEM_TYPES.GOLD) {
        // For potions, include prefix if present
        if (item.type === ITEM_TYPES.POTION && item.trueType) {
            const prefix = item.prefix ? (item.prefix.charAt(0).toUpperCase() + item.prefix.slice(1) + ' ') : '';
            const typeName = item.trueType.charAt(0).toUpperCase() + item.trueType.slice(1);
            return `${prefix}Potion of ${typeName}`;
        }
        return item.name || item.trueType;
    }
    return item.appearance;
}

/**
 * Check if entity is alive
 * @param {object} entity - Entity to check
 * @returns {boolean} True if alive
 */
export function isEntityAlive(entity) {
    return entity.hp > 0 && entity.isAlive !== false;
}

/**
 * Generate loot drop from defeated enemy
 * @param {object} enemy - Defeated enemy entity
 * @param {number} dungeonLevel - Current dungeon level
 * @returns {object|null} Item to drop, or null
 */
export function generateEnemyLoot(enemy, dungeonLevel) {
    // Drop chance varies by enemy type and level
    const baseDropChance = 0.3; // 30% base chance
    const dropRoll = Math.random();
    
    if (dropRoll > baseDropChance) {
        return null; // No drop
    }
    
    // Determine item type based on level
    const itemTypeRoll = Math.random();
    let itemType;
    
    if (itemTypeRoll < 0.25) {
        itemType = 'weapon';
    } else if (itemTypeRoll < 0.40) {
        itemType = 'armor';
    } else if (itemTypeRoll < 0.60) {
        itemType = 'potion';
    } else if (itemTypeRoll < 0.75) {
        itemType = 'food';
    } else if (itemTypeRoll < 0.90) {
        itemType = 'scroll';
    } else {
        itemType = 'gold';
    }
    
    // Create the item at enemy's position
    const spawn = {
        itemType: itemType,
        position: { ...enemy.position },
        level: dungeonLevel
    };
    
    return createItemFromSpawn(spawn);
}

/**
 * Create an item entity from spawn data
 * @param {object} spawn - Spawn data {itemType, position, level}
 * @param {object} rng - Seeded random number generator (optional)
 * @returns {object} Item entity
 */
export function createItemFromSpawn(spawn, rng = null) {
    const getRandom = () => rng ? rng.next() : Math.random();
    const getRandomInt = (min, max) => {
        const rand = getRandom();
        return Math.floor(rand * (max - min + 1)) + min;
    };
    
    const baseItem = {
        position: { ...spawn.position },
        level: spawn.level
    };
    
    switch (spawn.itemType) {
        case 'weapon': {
            const weaponTypes = [
                { name: 'Dagger', damage: [1, 4], bonus: 0 },
                { name: 'Short Sword', damage: [1, 6], bonus: 1 },
                { name: 'Long Sword', damage: [1, 8], bonus: 2 },
                { name: 'Battle Axe', damage: [1, 10], bonus: 1 },
                { name: 'Mace', damage: [2, 4], bonus: 0 }
            ];
            const weapon = weaponTypes[getRandomInt(0, weaponTypes.length - 1)];
            return { ...baseItem, ...createWeapon(weapon.name, weapon.damage, weapon.bonus) };
        }
        
        case 'armor': {
            const armorTypes = [
                { name: 'Leather Armor', acBonus: 1 },
                { name: 'Chain Mail', acBonus: 3 },
                { name: 'Plate Mail', acBonus: 5 },
                { name: 'Shield', acBonus: 2 }
            ];
            const armor = armorTypes[getRandomInt(0, armorTypes.length - 1)];
            return { ...baseItem, ...createArmor(armor.name, armor.acBonus) };
        }
        
        case 'potion': {
            const potionTypes = [
                { trueType: 'healing', appearance: 'red potion' },
                { trueType: 'healing', appearance: 'crimson potion' },
                { trueType: 'healing', appearance: 'ruby potion' },
                { trueType: 'poison', appearance: 'green potion' },
                { trueType: 'poison', appearance: 'emerald potion' },
                { trueType: 'invisibility', appearance: 'clear potion' },
                { trueType: 'invisibility', appearance: 'transparent potion' },
                { trueType: 'speed', appearance: 'blue potion' },
                { trueType: 'speed', appearance: 'azure potion' },
                { trueType: 'strength', appearance: 'orange potion' },
                { trueType: 'strength', appearance: 'amber potion' },
                { trueType: 'skill', appearance: 'yellow potion' },
                { trueType: 'skill', appearance: 'golden potion' },
                { trueType: 'sight', appearance: 'purple potion' },
                { trueType: 'sight', appearance: 'violet potion' },
                { trueType: 'attraction', appearance: 'black potion' },
                { trueType: 'attraction', appearance: 'dark potion' },
                { trueType: 'stone', appearance: 'gray potion' },
                { trueType: 'stone', appearance: 'silver potion' }
            ];
            
            // Determine prefix based on level
            let prefix = '';
            if (spawn.level <= 3) {
                // Lower levels: 60% lesser, 40% normal
                prefix = getRandomInt(0, 9) < 6 ? 'Lesser ' : '';
            } else if (spawn.level >= 7) {
                // Higher levels: 40% normal, 60% greater
                prefix = getRandomInt(0, 9) < 6 ? 'Greater ' : '';
            }
            // Middle levels (4-6): all normal, no prefix
            
            const potion = potionTypes[getRandomInt(0, potionTypes.length - 1)];
            const potionItem = createPotion(potion.trueType, potion.appearance, {});
            potionItem.prefix = prefix.trim().toLowerCase(); // 'lesser', 'greater', or ''
            return { ...baseItem, ...potionItem };
        }
        
        case 'scroll': {
            const scrollTypes = [
                { trueType: 'identify', appearance: 'dusty scroll' },
                { trueType: 'identify', appearance: 'ancient scroll' }
            ];
            const scroll = scrollTypes[getRandomInt(0, scrollTypes.length - 1)];
            return { ...baseItem, ...createScroll(scroll.trueType, scroll.appearance, {}) };
        }
        
        case 'food': {
            const foodTypes = [
                { name: 'ration', restore: 150 },
                { name: 'bread', restore: 100 },
                { name: 'apple', restore: 50 },
                { name: 'cheese', restore: 80 },
                { name: 'dried meat', restore: 120 }
            ];
            const food = foodTypes[getRandomInt(0, foodTypes.length - 1)];
            return { ...baseItem, ...createFood(food.name, food.restore) };
        }
        
        case 'gold': {
            const amount = getRandomInt(10, 50) * spawn.level;
            return { ...baseItem, ...createGold(amount) };
        }
        
        default:
            return { ...baseItem, ...createGold(10) };
    }
}

/**
 * Damage an entity
 * @param {object} entity - Entity to damage
 * @param {number} damage - Damage amount
 * @returns {object} Updated entity
 */
export function damageEntity(entity, damage) {
    const newHp = Math.max(0, entity.hp - damage);
    return {
        ...entity,
        hp: newHp,
        isAlive: newHp > 0
    };
}

/**
 * Get random enemy type for dungeon level
 * @param {number} dungeonLevel - Current dungeon level
 * @returns {string} Enemy type key
 */
export function getRandomEnemyTypeForLevel(dungeonLevel = 1) {
    // Get available enemy types based on spawn depth
    const availableTypes = Object.keys(ENEMY_TYPES).filter(
        type => ENEMY_TYPES[type].spawnDepth <= dungeonLevel
    );
    
    if (availableTypes.length === 0) {
        return 'GOBLIN'; // Fallback
    }
    
    // Weight-based selection
    const weights = availableTypes.map(type => ENEMY_TYPES[type].spawnWeight);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < availableTypes.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return availableTypes[i];
        }
    }
    
    return availableTypes[availableTypes.length - 1];
}

/**
 * Check if position is valid for spawning (walkable and not occupied)
 * @param {object} position - Grid position {x, y}
 * @param {Array<Array>} grid - 2D grid array
 * @param {Array<object>} existingEnemies - Existing enemies to avoid
 * @param {object} playerPosition - Player position to avoid
 * @returns {boolean} True if position is valid
 */
export function isValidSpawnPosition(position, grid, existingEnemies, playerPosition) {
    const { x, y } = position;
    
    // Check grid bounds
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
        return false;
    }
    
    // Check if walkable
    const tile = grid[y][x];
    if (tile !== 'floor' && tile !== 'door') {
        return false;
    }
    
    // Check if occupied by enemy
    const occupied = existingEnemies.some(e => e.position.x === x && e.position.y === y);
    if (occupied) {
        return false;
    }
    
    // Check if too close to player (should be at least 2 tiles away)
    const dx = Math.abs(x - playerPosition.x);
    const dy = Math.abs(y - playerPosition.y);
    if (dx + dy < 2) {
        return false;
    }
    
    return true;
}
