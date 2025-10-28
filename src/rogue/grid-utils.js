/**
 * Grid Utility Functions
 * Handles grid coordinate conversions, distance calculations, and pathfinding
 */

import { TILE_SIZE } from './constants.js';

/**
 * Convert world coordinates to grid coordinates
 * @param {number} x - World X coordinate
 * @param {number} z - World Z coordinate
 * @returns {{x: number, y: number}} Grid coordinates
 */
export function worldToGrid(x, z) {
    return {
        x: Math.floor(x / TILE_SIZE),
        y: Math.floor(z / TILE_SIZE)
    };
}

/**
 * Convert grid coordinates to world coordinates (center of tile)
 * @param {number} gridX - Grid X coordinate
 * @param {number} gridY - Grid Y coordinate
 * @returns {{x: number, z: number}} World coordinates
 */
export function gridToWorld(gridX, gridY) {
    return {
        x: gridX * TILE_SIZE + TILE_SIZE / 2,
        z: gridY * TILE_SIZE + TILE_SIZE / 2
    };
}

/**
 * Calculate Euclidean distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate Manhattan distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Manhattan distance
 */
export function manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/**
 * Get adjacent grid positions (4-directional)
 * @param {number} x - Grid X coordinate
 * @param {number} y - Grid Y coordinate
 * @returns {Array<{x: number, y: number}>} Adjacent positions
 */
export function getAdjacentPositions(x, y) {
    return [
        { x: x + 1, y: y },
        { x: x - 1, y: y },
        { x: x, y: y + 1 },
        { x: x, y: y - 1 }
    ];
}

/**
 * Check if a grid position is valid and walkable
 * @param {Array<Array>} grid - 2D grid array
 * @param {number} x - Grid X coordinate
 * @param {number} y - Grid Y coordinate
 * @param {string} walkableTile - Tile type that can be walked on (default: 'floor')
 * @returns {boolean} True if position is walkable
 */
export function isWalkable(grid, x, y, walkableTile = 'floor') {
    if (!grid || y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
        return false;
    }
    const tile = grid[y][x];
    return tile === walkableTile || tile === 'door' || tile === 'stairs_down' || tile === 'stairs_up';
}

/**
 * A* pathfinding algorithm
 * @param {Array<Array>} grid - 2D grid array
 * @param {{x: number, y: number}} start - Start position
 * @param {{x: number, y: number}} goal - Goal position
 * @returns {Array<{x: number, y: number}>} Path from start to goal (excluding start)
 */
export function findPath(grid, start, goal) {
    if (!isWalkable(grid, goal.x, goal.y)) {
        return [];
    }
    
    const openSet = [{ ...start, g: 0, h: manhattanDistance(start.x, start.y, goal.x, goal.y), f: 0, parent: null }];
    openSet[0].f = openSet[0].g + openSet[0].h;
    
    const closedSet = new Set();
    const visited = new Map();
    visited.set(`${start.x},${start.y}`, openSet[0]);
    
    while (openSet.length > 0) {
        // Find node with lowest f score
        let currentIndex = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < openSet[currentIndex].f) {
                currentIndex = i;
            }
        }
        
        const current = openSet[currentIndex];
        
        // Check if we reached the goal
        if (current.x === goal.x && current.y === goal.y) {
            const path = [];
            let node = current;
            while (node.parent !== null) {
                path.unshift({ x: node.x, y: node.y });
                node = node.parent;
            }
            return path;
        }
        
        // Move current from open to closed
        openSet.splice(currentIndex, 1);
        closedSet.add(`${current.x},${current.y}`);
        
        // Check all neighbors
        const neighbors = getAdjacentPositions(current.x, current.y);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            
            if (closedSet.has(neighborKey) || !isWalkable(grid, neighbor.x, neighbor.y)) {
                continue;
            }
            
            const g = current.g + 1;
            const h = manhattanDistance(neighbor.x, neighbor.y, goal.x, goal.y);
            const f = g + h;
            
            const existingNode = visited.get(neighborKey);
            if (!existingNode || g < existingNode.g) {
                const neighborNode = { x: neighbor.x, y: neighbor.y, g, h, f, parent: current };
                visited.set(neighborKey, neighborNode);
                
                if (!existingNode) {
                    openSet.push(neighborNode);
                }
            }
        }
    }
    
    return []; // No path found
}

/**
 * Get all tiles within a given radius
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} radius - Radius in tiles
 * @returns {Array<{x: number, y: number}>} List of positions within radius
 */
export function getTilesInRadius(centerX, centerY, radius) {
    const tiles = [];
    const radiusSquared = radius * radius;
    
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy <= radiusSquared) {
                tiles.push({ x: centerX + dx, y: centerY + dy });
            }
        }
    }
    
    return tiles;
}
