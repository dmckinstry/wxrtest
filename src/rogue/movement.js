/**
 * VR and Desktop Movement System
 * Handles smooth locomotion, keyboard controls, and combat mode detection
 */

import { MOVEMENT_THRESHOLD, COMBAT_DETECTION_RADIUS } from './constants.js';
import { distance } from './grid-utils.js';

/**
 * Read keyboard input axes and rotation
 * @param {object} keyStates - Object mapping key names to boolean states
 * @returns {{x: number, y: number, rotation: number}} Keyboard axes values (-1 to 1) and rotation
 */
export function readKeyboardAxes(keyStates) {
    if (!keyStates || typeof keyStates !== 'object') {
        return { x: 0, y: 0, rotation: 0 };
    }
    
    let x = 0;
    let y = 0;
    let rotation = 0;
    
    // WASD for movement (strafe and forward/back)
    if (keyStates['KeyW']) y -= 1;
    if (keyStates['KeyS']) y += 1;
    if (keyStates['KeyA']) x -= 1;
    if (keyStates['KeyD']) x += 1;
    
    // Arrow keys: Up/Down for forward/back, Left/Right for rotation (tank controls)
    if (keyStates['ArrowUp']) y -= 1;
    if (keyStates['ArrowDown']) y += 1;
    if (keyStates['ArrowLeft']) rotation += 1;  // Rotate left
    if (keyStates['ArrowRight']) rotation -= 1; // Rotate right
    
    return { x, y, rotation };
}

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
 * @param {number} yaw - Current camera/player yaw rotation in radians (optional)
 * @returns {{dx: number, dz: number}} Movement delta
 */
export function calculateMovementDelta(axes, deltaTime, speed = 2.0, yaw = 0) {
    // Apply deadzone
    const deadzone = 0.15;
    const x = Math.abs(axes.x) > deadzone ? axes.x : 0;
    const y = Math.abs(axes.y) > deadzone ? axes.y : 0;
    
    // Calculate movement relative to current rotation
    // In Three.js, positive Y rotation is counter-clockwise (left)
    // We want: forward (y=-1) to move in the direction we're facing
    const forward = -y * speed * deltaTime;
    const strafe = x * speed * deltaTime;
    
    // Apply rotation transformation
    const dx = strafe * Math.cos(yaw) - forward * Math.sin(yaw);
    const dz = strafe * Math.sin(yaw) + forward * Math.cos(yaw);
    
    return { dx, dz };
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
 * Calculate rotation delta from input
 * @param {number} rotationInput - Rotation input (-1 to 1, where 1 is counter-clockwise)
 * @param {number} deltaTime - Time delta in seconds
 * @param {number} rotationSpeed - Rotation speed in radians per second
 * @returns {number} Rotation delta in radians
 */
export function calculateRotationDelta(rotationInput, deltaTime, rotationSpeed = Math.PI) {
    return rotationInput * rotationSpeed * deltaTime;
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

/**
 * Calculate camera rotation from mouse movement
 * @param {number} deltaX - Mouse delta X
 * @param {number} deltaY - Mouse delta Y
 * @param {number} sensitivity - Mouse sensitivity
 * @returns {{yaw: number, pitch: number}} Camera rotation deltas in radians
 */
export function calculateCameraRotation(deltaX, deltaY, sensitivity = 0.002) {
    return {
        yaw: -deltaX * sensitivity,
        pitch: -deltaY * sensitivity
    };
}

/**
 * Clamp pitch rotation to prevent over-rotation
 * @param {number} pitch - Current pitch in radians
 * @param {number} min - Minimum pitch (default -PI/2)
 * @param {number} max - Maximum pitch (default PI/2)
 * @returns {number} Clamped pitch value
 */
export function clampPitch(pitch, min = -Math.PI / 2, max = Math.PI / 2) {
    return Math.max(min, Math.min(max, pitch));
}
