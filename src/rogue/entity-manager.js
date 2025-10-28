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
