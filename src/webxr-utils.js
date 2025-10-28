/**
 * WebXR Utility Functions
 * Testable utility functions extracted from the WebXR application
 */

/**
 * Creates a canvas with text rendered on it
 * @param {string} text - The text to render
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {object} options - Rendering options
 * @returns {HTMLCanvasElement} Canvas with rendered text
 */
export function createTextCanvas(text, width = 1024, height = 256, options = {}) {
    const {
        backgroundColor = '#000000',
        textColor = '#00ff00',
        font = 'Bold 100px Arial',
        textAlign = 'center',
        textBaseline = 'middle'
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    ctx.font = font;
    ctx.fillStyle = textColor;
    ctx.textAlign = textAlign;
    ctx.textBaseline = textBaseline;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    return canvas;
}

/**
 * Calculate camera aspect ratio
 * @param {number} width - Window width
 * @param {number} height - Window height
 * @returns {number} Aspect ratio
 */
export function calculateAspectRatio(width, height) {
    if (height === 0) {
        throw new Error('Height cannot be zero');
    }
    return width / height;
}

/**
 * Calculate rotation based on time
 * @param {number} time - Current time in milliseconds
 * @param {number} speed - Rotation speed multiplier
 * @returns {number} Rotation value
 */
export function calculateRotation(time, speed = 0.0005) {
    return Math.sin(time * speed) * 0.2;
}

/**
 * Validate WebXR support configuration
 * @param {object} config - Configuration object
 * @returns {boolean} True if configuration is valid
 */
export function validateConfig(config) {
    if (!config || typeof config !== 'object') {
        return false;
    }
    
    // Check for required properties
    if (!config.camera || typeof config.camera !== 'object') {
        return false;
    }
    if (!config.renderer || typeof config.renderer !== 'object') {
        return false;
    }
    if (!config.scene || typeof config.scene !== 'object') {
        return false;
    }
    
    return true;
}

/**
 * Calculate cube rotation increment
 * @param {number} currentRotation - Current rotation value
 * @param {number} increment - Rotation increment
 * @returns {number} New rotation value
 */
export function calculateCubeRotation(currentRotation, increment = 0.01) {
    return currentRotation + increment;
}

/**
 * Validate color value
 * @param {number} color - Color value in hex format
 * @returns {boolean} True if color is valid
 */
export function validateColor(color) {
    if (typeof color !== 'number') {
        return false;
    }
    return color >= 0x000000 && color <= 0xffffff;
}
