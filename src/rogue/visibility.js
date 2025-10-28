/**
 * Visibility and Fog of War System
 * Computes visible tiles and manages explored tiles
 */

import { TILE_SIZE, VISIBILITY_RADIUS } from './constants.js';
import { distance } from './grid-utils.js';

/**
 * Compute visible tiles from a position using radius-based visibility
 * @param {Array<Array>} grid - 2D grid array
 * @param {object} position - Position {x, y} in grid coordinates
 * @param {number} radius - Visibility radius in meters
 * @returns {Set<string>} Set of visible tile coordinates as "x,y" strings
 */
export function computeVisibleTiles(grid, position, radius = VISIBILITY_RADIUS) {
    const visibleTiles = new Set();
    const radiusInTiles = Math.ceil(radius / TILE_SIZE);
    
    // Use simple radius-based visibility
    for (let dy = -radiusInTiles; dy <= radiusInTiles; dy++) {
        for (let dx = -radiusInTiles; dx <= radiusInTiles; dx++) {
            const x = position.x + dx;
            const y = position.y + dy;
            
            // Check if within grid bounds
            if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
                continue;
            }
            
            // Check if within radius (using actual distance)
            const dist = distance(position.x, position.y, x, y);
            if (dist * TILE_SIZE <= radius) {
                visibleTiles.add(`${x},${y}`);
            }
        }
    }
    
    return visibleTiles;
}

/**
 * Update explored tiles set with newly visible tiles
 * @param {Set<string>} exploredTiles - Set of explored tile coordinates
 * @param {Set<string>} visibleTiles - Set of currently visible tile coordinates
 * @returns {Set<string>} Updated explored tiles set
 */
export function updateExploredTiles(exploredTiles, visibleTiles) {
    const newExplored = new Set(exploredTiles);
    
    for (const tile of visibleTiles) {
        newExplored.add(tile);
    }
    
    return newExplored;
}

/**
 * Check if a tile is visible
 * @param {Set<string>} visibleTiles - Set of visible tile coordinates
 * @param {number} x - Tile x coordinate
 * @param {number} y - Tile y coordinate
 * @returns {boolean} True if tile is visible
 */
export function isTileVisible(visibleTiles, x, y) {
    return visibleTiles.has(`${x},${y}`);
}

/**
 * Check if a tile has been explored
 * @param {Set<string>} exploredTiles - Set of explored tile coordinates
 * @param {number} x - Tile x coordinate
 * @param {number} y - Tile y coordinate
 * @returns {boolean} True if tile has been explored
 */
export function isTileExplored(exploredTiles, x, y) {
    return exploredTiles.has(`${x},${y}`);
}

/**
 * Get visibility state of a tile
 * @param {Set<string>} visibleTiles - Set of visible tile coordinates
 * @param {Set<string>} exploredTiles - Set of explored tile coordinates
 * @param {number} x - Tile x coordinate
 * @param {number} y - Tile y coordinate
 * @returns {string} 'visible', 'explored', or 'hidden'
 */
export function getTileVisibilityState(visibleTiles, exploredTiles, x, y) {
    if (isTileVisible(visibleTiles, x, y)) {
        return 'visible';
    }
    if (isTileExplored(exploredTiles, x, y)) {
        return 'explored';
    }
    return 'hidden';
}

/**
 * Filter entities by visibility
 * @param {Array<object>} entities - List of entities with position property
 * @param {Set<string>} visibleTiles - Set of visible tile coordinates
 * @returns {Array<object>} Filtered list of visible entities
 */
export function filterVisibleEntities(entities, visibleTiles) {
    return entities.filter(entity => {
        const key = `${entity.position.x},${entity.position.y}`;
        return visibleTiles.has(key);
    });
}
