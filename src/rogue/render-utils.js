/**
 * 3D Rendering Utilities for Dungeon
 * Creates Three.js geometries and materials for dungeon visualization
 */

import { PALETTE, MATERIAL_PROPS, TILE_SIZE } from './constants.js';

/**
 * Get floor color based on visibility state
 * @param {string} visibilityState - 'visible', 'explored', or 'hidden'
 * @returns {number} Color hex value
 */
export function getFloorColor(visibilityState) {
    if (visibilityState === 'explored') {
        return PALETTE.EXPLORED;
    } else if (visibilityState === 'hidden') {
        return PALETTE.HIDDEN;
    }
    return PALETTE.FLOOR;
}

/**
 * Create a wall mesh
 * @param {object} THREE - Three.js library
 * @param {number} x - World X position
 * @param {number} z - World Z position
 * @returns {object} Three.js Mesh
 */
export function createWall(THREE, x, z) {
    const geometry = new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE);
    const material = new THREE.MeshStandardMaterial({
        color: PALETTE.WALL,
        ...MATERIAL_PROPS
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, TILE_SIZE / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

/**
 * Create a floor mesh
 * @param {object} THREE - Three.js library
 * @param {number} x - World X position
 * @param {number} z - World Z position
 * @param {string} visibilityState - 'visible', 'explored', or 'hidden'
 * @returns {object} Three.js Mesh
 */
export function createFloor(THREE, x, z, visibilityState = 'visible') {
    const geometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
    const color = getFloorColor(visibilityState);
    
    const material = new THREE.MeshStandardMaterial({
        color: color,
        ...MATERIAL_PROPS,
        side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 0, z);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    return mesh;
}

/**
 * Create stairs down mesh
 * @param {object} THREE - Three.js library
 * @param {number} x - World X position
 * @param {number} z - World Z position
 * @returns {object} Three.js Mesh
 */
export function createStairsDown(THREE, x, z) {
    const geometry = new THREE.BoxGeometry(TILE_SIZE * 0.8, 0.2, TILE_SIZE * 0.8);
    const material = new THREE.MeshStandardMaterial({
        color: PALETTE.STAIRS_DOWN,
        ...MATERIAL_PROPS,
        emissive: PALETTE.STAIRS_DOWN,
        emissiveIntensity: 0.3
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 0.1, z);
    return mesh;
}

/**
 * Create a point light for a room
 * @param {object} THREE - Three.js library
 * @param {number} x - World X position
 * @param {number} z - World Z position
 * @param {boolean} visible - Whether the light should be on
 * @returns {object} Three.js PointLight
 */
export function createRoomLight(THREE, x, z, visible = false) {
    const light = new THREE.PointLight(0xffffff, visible ? 1.0 : 0.0, 10);
    light.position.set(x, TILE_SIZE, z);
    light.castShadow = true;
    return light;
}

/**
 * Update floor color based on visibility state
 * @param {object} mesh - Three.js Mesh
 * @param {string} visibilityState - 'visible', 'explored', or 'hidden'
 */
export function updateFloorVisibility(mesh, visibilityState) {
    const color = getFloorColor(visibilityState);
    mesh.material.color.setHex(color);
}

/**
 * Create movement indicator ring
 * @param {object} THREE - Three.js library
 * @param {number} radius - Ring radius
 * @param {number} maxRadius - Maximum radius for budget indicator
 * @returns {object} Three.js Mesh
 */
export function createMovementIndicator(THREE, radius, maxRadius) {
    const geometry = new THREE.RingGeometry(radius - 0.1, radius, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.01;
    return mesh;
}

/**
 * Create enemy mesh based on type
 * @param {object} THREE - Three.js library
 * @param {object} enemyConfig - Enemy configuration from constants
 * @param {number} x - World X position
 * @param {number} z - World Z position
 * @returns {object} Three.js Mesh
 */
export function createEnemy(THREE, enemyConfig, x, z) {
    let geometry;
    
    switch (enemyConfig.geometry) {
        case 'box':
            geometry = new THREE.BoxGeometry(...enemyConfig.size);
            break;
        case 'cone':
            geometry = new THREE.ConeGeometry(...enemyConfig.size);
            break;
        case 'sphere':
            geometry = new THREE.SphereGeometry(...enemyConfig.size);
            break;
        case 'tetrahedron':
            geometry = new THREE.TetrahedronGeometry(...enemyConfig.size);
            break;
        default:
            geometry = new THREE.BoxGeometry(1, 1, 1);
    }
    
    const material = new THREE.MeshStandardMaterial({
        color: enemyConfig.color,
        ...MATERIAL_PROPS
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 1, z);
    mesh.castShadow = true;
    return mesh;
}

/**
 * Create player mesh
 * @param {object} THREE - Three.js library
 * @returns {object} Three.js Mesh
 */
export function createPlayer(THREE) {
    const geometry = new THREE.CapsuleGeometry(0.3, 1.2, 8, 16);
    const material = new THREE.MeshStandardMaterial({
        color: PALETTE.PLAYER,
        ...MATERIAL_PROPS
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.9;
    mesh.castShadow = true;
    return mesh;
}

/**
 * Calculate HP bar color based on percentage
 * @param {number} hpPercent - HP percentage (0-1)
 * @returns {string} Hex color string
 */
export function getHPColor(hpPercent) {
    if (hpPercent > 0.6) return '#00ff00';
    if (hpPercent > 0.3) return '#ffff00';
    return '#ff0000';
}

/**
 * Calculate hunger bar color based on percentage
 * @param {number} hungerPercent - Hunger percentage (0-1)
 * @returns {string} Hex color string
 */
export function getHungerColor(hungerPercent) {
    if (hungerPercent > 0.5) return '#00ff00';
    if (hungerPercent > 0.2) return '#ffaa00';
    return '#ff0000';
}

/**
 * Format HUD text lines from stats
 * @param {object} stats - Stats to display {hp, maxHp, hunger, maxHunger, level, turn}
 * @returns {Array<{text: string, color: string}>} Formatted text lines with colors
 */
export function formatHUDText(stats) {
    const hpPercent = stats.hp / stats.maxHp;
    const hungerPercent = stats.hunger / stats.maxHunger;
    
    return [
        {
            text: `HP: ${stats.hp}/${stats.maxHp}`,
            color: getHPColor(hpPercent)
        },
        {
            text: `Hunger: ${stats.hunger}`,
            color: getHungerColor(hungerPercent)
        },
        {
            text: `Level: ${stats.level}`,
            color: '#00ff00'
        },
        {
            text: `Turn: ${stats.turn}`,
            color: '#00ff00'
        }
    ];
}

/**
 * Create HUD canvas for stats display
 * @param {object} stats - Stats to display {hp, maxHp, hunger, level, turn}
 * @returns {HTMLCanvasElement} Canvas with HUD
 */
export function createHUDCanvas(stats) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text
    ctx.font = 'Bold 30px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const lineHeight = 40;
    const lines = formatHUDText(stats);
    
    lines.forEach((line, index) => {
        ctx.fillStyle = line.color;
        ctx.fillText(line.text, 10, 10 + index * lineHeight);
    });
    
    return canvas;
}
