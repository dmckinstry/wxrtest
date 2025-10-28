/**
 * Unit tests for render utilities
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    createHUDCanvas,
    getHPColor,
    getHungerColor,
    formatHUDText,
    getFloorColor
} from '../../../src/rogue/render-utils.js';
import { PALETTE } from '../../../src/rogue/constants.js';

// Mock THREE.js objects for testing
const mockTHREE = {
    BoxGeometry: class { constructor(...args) { this.args = args; } },
    PlaneGeometry: class { constructor(...args) { this.args = args; } },
    ConeGeometry: class { constructor(...args) { this.args = args; } },
    SphereGeometry: class { constructor(...args) { this.args = args; } },
    TetrahedronGeometry: class { constructor(...args) { this.args = args; } },
    CapsuleGeometry: class { constructor(...args) { this.args = args; } },
    RingGeometry: class { constructor(...args) { this.args = args; } },
    MeshStandardMaterial: class { constructor(props) { this.props = props; } },
    MeshBasicMaterial: class { constructor(props) { this.props = props; } },
    Mesh: class { 
        constructor(geometry, material) { 
            this.geometry = geometry;
            this.material = material;
            this.position = { set: () => {}, x: 0, y: 0, z: 0 };
            this.rotation = { x: 0 };
            this.castShadow = false;
            this.receiveShadow = false;
            this.visible = true;
        }
    },
    PointLight: class {
        constructor(color, intensity, distance) {
            this.color = color;
            this.intensity = intensity;
            this.distance = distance;
            this.position = { set: () => {} };
            this.castShadow = false;
        }
    },
    DoubleSide: 2
};

describe('Render Utils', () => {
    describe('getFloorColor', () => {
        it('should return floor color for visible state', () => {
            // Arrange & Act
            const color = getFloorColor('visible');
            
            // Assert
            expect(color).toBe(PALETTE.FLOOR);
        });

        it('should return explored color for explored state', () => {
            const color = getFloorColor('explored');
            
            expect(color).toBe(PALETTE.EXPLORED);
        });

        it('should return hidden color for hidden state', () => {
            const color = getFloorColor('hidden');
            
            expect(color).toBe(PALETTE.HIDDEN);
        });

        it('should default to floor color for unknown state', () => {
            const color = getFloorColor('unknown');
            
            expect(color).toBe(PALETTE.FLOOR);
        });
    });

    describe('getHPColor', () => {
        it('should return green for high HP', () => {
            // Arrange & Act
            const color = getHPColor(0.8);
            
            // Assert
            expect(color).toBe('#00ff00');
        });

        it('should return yellow for medium HP', () => {
            const color = getHPColor(0.5);
            
            expect(color).toBe('#ffff00');
        });

        it('should return red for low HP', () => {
            const color = getHPColor(0.2);
            
            expect(color).toBe('#ff0000');
        });

        it('should return green at 60% threshold', () => {
            expect(getHPColor(0.61)).toBe('#00ff00');
            expect(getHPColor(0.60)).toBe('#ffff00');
        });

        it('should return yellow at 30% threshold', () => {
            expect(getHPColor(0.31)).toBe('#ffff00');
            expect(getHPColor(0.30)).toBe('#ff0000');
        });
    });

    describe('getHungerColor', () => {
        it('should return green for high hunger', () => {
            // Arrange & Act
            const color = getHungerColor(0.8);
            
            // Assert
            expect(color).toBe('#00ff00');
        });

        it('should return orange for medium hunger', () => {
            const color = getHungerColor(0.3);
            
            expect(color).toBe('#ffaa00');
        });

        it('should return red for low hunger', () => {
            const color = getHungerColor(0.1);
            
            expect(color).toBe('#ff0000');
        });

        it('should return green at 50% threshold', () => {
            expect(getHungerColor(0.51)).toBe('#00ff00');
            expect(getHungerColor(0.50)).toBe('#ffaa00');
        });

        it('should return orange at 20% threshold', () => {
            expect(getHungerColor(0.21)).toBe('#ffaa00');
            expect(getHungerColor(0.20)).toBe('#ff0000');
        });
    });

    describe('formatHUDText', () => {
        it('should format stats into text lines', () => {
            // Arrange
            const stats = {
                hp: 15,
                maxHp: 20,
                hunger: 500,
                maxHunger: 1000,
                level: 3,
                turn: 25
            };
            
            // Act
            const lines = formatHUDText(stats);
            
            // Assert
            expect(lines).toHaveLength(4);
            expect(lines[0].text).toBe('HP: 15/20');
            expect(lines[1].text).toBe('Hunger: 500');
            expect(lines[2].text).toBe('Level: 3');
            expect(lines[3].text).toBe('Turn: 25');
        });

        it('should use correct colors based on percentages', () => {
            const stats = {
                hp: 10,
                maxHp: 20,  // 50% - yellow
                hunger: 400,
                maxHunger: 1000,  // 40% - orange
                level: 3,
                turn: 25
            };
            
            const lines = formatHUDText(stats);
            
            expect(lines[0].color).toBe('#ffff00');  // HP yellow
            expect(lines[1].color).toBe('#ffaa00');  // Hunger orange
            expect(lines[2].color).toBe('#00ff00');  // Level green
            expect(lines[3].color).toBe('#00ff00');  // Turn green
        });

        it('should handle low HP', () => {
            const stats = {
                hp: 5,
                maxHp: 20,  // 25% - red
                hunger: 800,
                maxHunger: 1000,
                level: 1,
                turn: 10
            };
            
            const lines = formatHUDText(stats);
            
            expect(lines[0].color).toBe('#ff0000');
        });

        it('should handle low hunger', () => {
            const stats = {
                hp: 18,
                maxHp: 20,
                hunger: 100,
                maxHunger: 1000,  // 10% - red
                level: 2,
                turn: 50
            };
            
            const lines = formatHUDText(stats);
            
            expect(lines[1].color).toBe('#ff0000');
        });
    });

    describe('createHUDCanvas', () => {
        it('should create canvas with stats', () => {
            // Arrange
            const stats = {
                hp: 15,
                maxHp: 20,
                hunger: 500,
                maxHunger: 1000,
                level: 3,
                turn: 25
            };
            
            // Act
            const canvas = createHUDCanvas(stats);
            
            // Assert
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(canvas.width).toBe(512);
            expect(canvas.height).toBe(256);
        });

        it('should render text on canvas', () => {
            const stats = {
                hp: 10,
                maxHp: 20,
                hunger: 800,
                maxHunger: 1000,
                level: 1,
                turn: 5
            };
            
            const canvas = createHUDCanvas(stats);
            const ctx = canvas.getContext('2d');
            
            // Verify context exists
            expect(ctx).not.toBeNull();
            
            // Get image data to verify something was drawn
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hasPixels = imageData.data.some(value => value !== 0);
            expect(hasPixels).toBe(true);
        });

        it('should handle full health', () => {
            const stats = {
                hp: 20,
                maxHp: 20,
                hunger: 1000,
                maxHunger: 1000,
                level: 1,
                turn: 1
            };
            
            const canvas = createHUDCanvas(stats);
            
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        });

        it('should handle low health', () => {
            const stats = {
                hp: 2,
                maxHp: 20,
                hunger: 100,
                maxHunger: 1000,
                level: 5,
                turn: 100
            };
            
            const canvas = createHUDCanvas(stats);
            
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        });

        it('should handle zero hunger', () => {
            const stats = {
                hp: 10,
                maxHp: 20,
                hunger: 0,
                maxHunger: 1000,
                level: 2,
                turn: 50
            };
            
            const canvas = createHUDCanvas(stats);
            
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        });
    });
});
