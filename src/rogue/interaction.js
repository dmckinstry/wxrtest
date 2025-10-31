/**
 * Interaction System
 * Handles player interactions with the environment (items, stairs, monsters)
 */

import { isEntityAlive } from './entity-manager.js';

/**
 * Find interactable entities at player's position
 * @param {object} position - Player's grid position {x, y}
 * @param {object} entities - Game entities {enemies, items}
 * @param {string} tile - Tile type at player's position
 * @returns {object} Interactable entities {items: Array, stairs: boolean, enemies: Array}
 */
export function findInteractablesAtPosition(position, entities, tile) {
    const result = {
        items: [],
        stairs: tile === 'stairs_down',
        enemies: []
    };
    
    // Find items at position
    if (entities.items) {
        result.items = entities.items.filter(item => 
            item.position.x === position.x && item.position.y === position.y
        );
    }
    
    // Find enemies at adjacent positions (within attack range)
    if (entities.enemies) {
        result.enemies = entities.enemies.filter(enemy => {
            if (!isEntityAlive(enemy)) return false;
            
            const dx = Math.abs(enemy.position.x - position.x);
            const dy = Math.abs(enemy.position.y - position.y);
            
            // Adjacent includes diagonals
            return dx <= 1 && dy <= 1 && (dx > 0 || dy > 0);
        });
    }
    
    return result;
}

/**
 * Get interaction prompt message
 * @param {object} interactables - Interactables from findInteractablesAtPosition
 * @returns {string} Prompt message
 */
export function getInteractionPrompt(interactables) {
    const messages = [];
    
    if (interactables.items.length > 0) {
        messages.push(`Pick up ${interactables.items[0].name || 'item'}`);
    }
    
    if (interactables.stairs) {
        messages.push('Descend stairs');
    }
    
    if (interactables.enemies.length > 0) {
        messages.push(`Attack ${interactables.enemies[0].name}`);
    }
    
    return messages.length > 0 ? messages.join(' / ') : '';
}

/**
 * Prioritize what action to take when interacting
 * @param {object} interactables - Interactables from findInteractablesAtPosition
 * @returns {object|null} {type: string, target: object} or null if nothing to interact with
 */
export function getInteractionAction(interactables) {
    // Priority: enemies > items > stairs
    
    if (interactables.enemies.length > 0) {
        return {
            type: 'attack',
            target: interactables.enemies[0]
        };
    }
    
    if (interactables.items.length > 0) {
        return {
            type: 'pickup',
            target: interactables.items[0]
        };
    }
    
    if (interactables.stairs) {
        return {
            type: 'descend',
            target: null
        };
    }
    
    return null;
}
