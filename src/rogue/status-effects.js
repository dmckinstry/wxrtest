/**
 * Status Effects System
 * Manages temporary buffs and debuffs on the player
 */

/**
 * Status effect types
 */
export const STATUS_TYPES = {
    INVISIBILITY: 'invisibility',
    POISON: 'poison',
    SPEED: 'speed',
    STRENGTH: 'strength',
    SKILL: 'skill',
    SIGHT: 'sight',
    ATTRACTION: 'attraction',
    STONE: 'stone'
};

/**
 * Create a status effect
 * @param {string} type - Effect type from STATUS_TYPES
 * @param {number} duration - Duration in turns
 * @param {number} magnitude - Effect magnitude (optional)
 * @returns {object} Status effect
 */
export function createStatusEffect(type, duration, magnitude = 1) {
    return {
        type,
        duration,
        magnitude,
        turnsRemaining: duration
    };
}

/**
 * Add a status effect to player
 * @param {Array} activeEffects - Current active effects
 * @param {object} effect - Effect to add
 * @returns {Array} Updated effects list
 */
export function addStatusEffect(activeEffects, effect) {
    // Check if effect already exists
    const existing = activeEffects.findIndex(e => e.type === effect.type);
    
    if (existing >= 0) {
        // Replace with new effect (longer duration or stronger magnitude)
        if (effect.duration > activeEffects[existing].turnsRemaining) {
            activeEffects[existing] = effect;
        }
        return activeEffects;
    }
    
    // Add new effect
    return [...activeEffects, effect];
}

/**
 * Update status effects (called each turn)
 * @param {Array} activeEffects - Current active effects
 * @returns {Array} Updated effects list
 */
export function updateStatusEffects(activeEffects) {
    return activeEffects
        .map(effect => ({
            ...effect,
            turnsRemaining: effect.turnsRemaining - 1
        }))
        .filter(effect => effect.turnsRemaining > 0);
}

/**
 * Check if player has a specific effect
 * @param {Array} activeEffects - Current active effects
 * @param {string} type - Effect type to check
 * @returns {boolean} True if player has the effect
 */
export function hasStatusEffect(activeEffects, type) {
    return activeEffects.some(e => e.type === type);
}

/**
 * Get status effect by type
 * @param {Array} activeEffects - Current active effects
 * @param {string} type - Effect type to get
 * @returns {object|null} Effect or null
 */
export function getStatusEffect(activeEffects, type) {
    return activeEffects.find(e => e.type === type) || null;
}

/**
 * Get display string for active effects
 * @param {Array} activeEffects - Current active effects
 * @returns {Array<string>} Display strings for each effect
 */
export function getEffectDisplayStrings(activeEffects) {
    return activeEffects.map(effect => {
        const name = effect.type.charAt(0).toUpperCase() + effect.type.slice(1);
        return `${name} (${effect.turnsRemaining})`;
    });
}
