/**
 * Combat System
 * Handles turn-based combat mechanics
 */

/**
 * Roll a d20
 * @returns {number} Result (1-20)
 */
export function rollD20() {
    return Math.floor(Math.random() * 20) + 1;
}

/**
 * Roll damage dice
 * @param {number} count - Number of dice
 * @param {number} sides - Sides per die
 * @param {number} bonus - Bonus to add
 * @returns {number} Total damage
 */
export function rollDamage(count, sides, bonus = 0) {
    let total = bonus;
    for (let i = 0; i < count; i++) {
        total += Math.floor(Math.random() * sides) + 1;
    }
    return Math.max(1, total); // Minimum 1 damage
}

/**
 * Calculate if an attack hits
 * @param {object} attacker - Attacker entity with attackBonus
 * @param {object} defender - Defender entity with ac
 * @param {number} roll - d20 roll (optional, will roll if not provided)
 * @returns {object} {hit: boolean, roll: number, natural20: boolean}
 */
export function calculateHit(attacker, defender, roll = null) {
    if (roll === null) {
        roll = rollD20();
    }
    
    const attackBonus = attacker.attackBonus || 0;
    const totalRoll = roll + attackBonus;
    const defenderAC = defender.ac || 10;
    
    return {
        hit: totalRoll >= defenderAC || roll === 20,
        roll: roll,
        natural20: roll === 20,
        natural1: roll === 1,
        totalRoll: totalRoll
    };
}

/**
 * Execute a combat attack
 * @param {object} attacker - Attacker entity
 * @param {object} defender - Defender entity
 * @returns {object} Combat result {hit, damage, killed, attackRoll}
 */
export function executeAttack(attacker, defender) {
    const attackResult = calculateHit(attacker, defender);
    
    if (!attackResult.hit) {
        return {
            hit: false,
            damage: 0,
            killed: false,
            attackRoll: attackResult
        };
    }
    
    // Calculate damage
    let damage = 0;
    if (attacker.weapon) {
        damage = rollDamage(
            attacker.weapon.damage[0],
            attacker.weapon.damage[1],
            attacker.weapon.bonus || 0
        );
    } else if (attacker.damage) {
        damage = rollDamage(
            attacker.damage[0],
            attacker.damage[1],
            attacker.damageBonus || 0
        );
    } else {
        damage = rollDamage(1, 4, 0); // Default 1d4
    }
    
    // Critical hit doubles damage
    if (attackResult.natural20) {
        damage *= 2;
    }
    
    const newDefenderHp = Math.max(0, defender.hp - damage);
    const killed = newDefenderHp === 0;
    
    return {
        hit: true,
        damage: damage,
        killed: killed,
        attackRoll: attackResult,
        critical: attackResult.natural20
    };
}

/**
 * Process enemy turn (move and/or attack)
 * @param {object} enemy - Enemy entity
 * @param {object} playerPosition - Player grid position
 * @param {Array<Array>} grid - Dungeon grid
 * @param {function} findPath - Pathfinding function
 * @returns {object} {action: 'move'|'attack'|'wait', newPosition?, target?}
 */
export function processEnemyTurn(enemy, playerPosition, grid, findPath) {
    if (!enemy.isAlive) {
        return { action: 'wait' };
    }
    
    // Check if player is adjacent (can attack)
    const dx = Math.abs(enemy.position.x - playerPosition.x);
    const dy = Math.abs(enemy.position.y - playerPosition.y);
    
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        return { action: 'attack', target: 'player' };
    }
    
    // Find path to player
    const path = findPath(grid, enemy.position, playerPosition);
    
    if (path.length > 0) {
        // Move one step along path
        return { action: 'move', newPosition: path[0] };
    }
    
    return { action: 'wait' };
}

/**
 * Check if position is adjacent to target
 * @param {object} pos1 - First position {x, y}
 * @param {object} pos2 - Second position {x, y}
 * @returns {boolean} True if adjacent (4-directional)
 */
export function isAdjacent(pos1, pos2) {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

/**
 * Get combat log message
 * @param {string} attackerName - Attacker name
 * @param {string} defenderName - Defender name
 * @param {object} result - Combat result
 * @returns {string} Log message
 */
export function getCombatMessage(attackerName, defenderName, result) {
    if (!result.hit) {
        return `${attackerName} attacks ${defenderName} but misses!`;
    }
    
    let message = `${attackerName} hits ${defenderName} for ${result.damage} damage!`;
    
    if (result.critical) {
        message = `CRITICAL! ${message}`;
    }
    
    if (result.killed) {
        message += ` ${defenderName} is defeated!`;
    }
    
    return message;
}
