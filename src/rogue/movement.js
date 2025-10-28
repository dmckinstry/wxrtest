/**
 * VR Movement System
 * Handles smooth locomotion and combat mode detection
 */

import { MOVEMENT_THRESHOLD, COMBAT_DETECTION_RADIUS } from './constants.js';
import { distance } from './grid-utils.js';

/**
 * Read controller joystick axes
 * @param {object} controller - WebXR controller
 * @returns {{x: number, y: number}} Joystick axes values (-1 to 1)
 */
export function readJoystickAxes(controller) {
    if (!controller || !controller.gamepad || !controller.gamepad.axes) {
        return { x: 0, y: 0 };
    }
    
    // axes[2] is typically left/right, axes[3] is forward/back
    return {
        x: controller.gamepad.axes[2] || 0,
        y: controller.gamepad.axes[3] || 0
    };
}

/**
 * Calculate movement delta from joystick input
 * @param {object} axes - Joystick axes {x, y}
 * @param {number} deltaTime - Time delta in seconds
 * @param {number} speed - Movement speed (meters per second)
 * @returns {{dx: number, dz: number}} Movement delta
 */
export function calculateMovementDelta(axes, deltaTime, speed = 2.0) {
    // Apply deadzone
    const deadzone = 0.15;
    const x = Math.abs(axes.x) > deadzone ? axes.x : 0;
    const y = Math.abs(axes.y) > deadzone ? axes.y : 0;
    
    return {
        dx: x * speed * deltaTime,
        dz: y * speed * deltaTime
    };
}

/**
 * Calculate distance moved
 * @param {object} delta - Movement delta {dx, dz}
 * @returns {number} Distance
 */
export function calculateMovementDistance(delta) {
    return Math.sqrt(delta.dx * delta.dx + delta.dz * delta.dz);
}

/**
 * Check if player should enter combat mode based on enemy proximity
 * @param {object} playerPos - Player position {x, y, z}
 * @param {Array<object>} enemies - List of enemies with position property
 * @param {number} radius - Detection radius
 * @returns {boolean} True if should enter combat mode
 */
export function detectCombatMode(playerPos, enemies, radius = COMBAT_DETECTION_RADIUS) {
    for (const enemy of enemies) {
        const dist = distance(
            playerPos.x,
            playerPos.z,
            enemy.position.x,
            enemy.position.z
        );
        
        if (dist <= radius) {
            return true;
        }
    }
    
    return false;
}

/**
 * Calculate movement budget remaining in current turn
 * @param {number} accumulated - Accumulated movement
 * @param {number} threshold - Movement threshold for turn advancement
 * @returns {number} Remaining budget (0-1 normalized)
 */
export function calculateMovementBudget(accumulated, threshold = MOVEMENT_THRESHOLD) {
    const remaining = threshold - accumulated;
    return Math.max(0, remaining / threshold);
}

/**
 * Apply collision detection for wall tiles
 * @param {object} newPosition - Proposed new position {x, y, z}
 * @param {Array<Array>} grid - 2D grid array
 * @param {function} worldToGrid - Function to convert world to grid coords
 * @param {function} isWalkable - Function to check if tile is walkable
 * @returns {boolean} True if position is valid
 */
export function checkCollision(newPosition, grid, worldToGrid, isWalkable) {
    const gridPos = worldToGrid(newPosition.x, newPosition.z);
    return isWalkable(grid, gridPos.x, gridPos.y);
}
