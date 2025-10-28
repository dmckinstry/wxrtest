/**
 * Unit tests for WebXR utility functions
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    createTextCanvas,
    calculateAspectRatio,
    calculateRotation,
    validateConfig,
    calculateCubeRotation,
    validateColor
} from '../../src/webxr-utils.js';

describe('WebXR Utilities', () => {
    describe('createTextCanvas', () => {
        it('should create a canvas with default dimensions', () => {
            const canvas = createTextCanvas('Hello');
            
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(canvas.width).toBe(1024);
            expect(canvas.height).toBe(256);
        });

        it('should create a canvas with custom dimensions', () => {
            const canvas = createTextCanvas('Test', 512, 128);
            
            expect(canvas.width).toBe(512);
            expect(canvas.height).toBe(128);
        });

        it('should render text on canvas', () => {
            const canvas = createTextCanvas('HELLO WORLD');
            const ctx = canvas.getContext('2d');
            
            // Verify context exists
            expect(ctx).not.toBeNull();
            
            // Get image data to verify something was drawn
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hasPixels = imageData.data.some(value => value !== 0);
            expect(hasPixels).toBe(true);
        });

        it('should accept custom options', () => {
            const options = {
                backgroundColor: '#ff0000',
                textColor: '#0000ff',
                font: '50px Arial'
            };
            const canvas = createTextCanvas('Test', 1024, 256, options);
            
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        });
    });

    describe('calculateAspectRatio', () => {
        it('should calculate correct aspect ratio', () => {
            expect(calculateAspectRatio(1920, 1080)).toBeCloseTo(1.777, 2);
            expect(calculateAspectRatio(1280, 720)).toBeCloseTo(1.777, 2);
            expect(calculateAspectRatio(800, 600)).toBeCloseTo(1.333, 2);
        });

        it('should handle square dimensions', () => {
            expect(calculateAspectRatio(1000, 1000)).toBe(1);
        });

        it('should throw error for zero height', () => {
            expect(() => calculateAspectRatio(1920, 0)).toThrow('Height cannot be zero');
        });

        it('should handle portrait orientation', () => {
            expect(calculateAspectRatio(1080, 1920)).toBeCloseTo(0.5625, 2);
        });
    });

    describe('calculateRotation', () => {
        it('should calculate rotation based on time', () => {
            const rotation = calculateRotation(1000);
            expect(rotation).toBeGreaterThanOrEqual(-0.2);
            expect(rotation).toBeLessThanOrEqual(0.2);
        });

        it('should use custom speed multiplier', () => {
            const slowRotation = calculateRotation(1000, 0.0001);
            const fastRotation = calculateRotation(1000, 0.001);
            
            expect(Math.abs(fastRotation)).toBeGreaterThan(Math.abs(slowRotation));
        });

        it('should return zero at time zero', () => {
            const rotation = calculateRotation(0);
            expect(rotation).toBe(0);
        });

        it('should handle negative time values', () => {
            const rotation = calculateRotation(-1000);
            expect(rotation).toBeGreaterThanOrEqual(-0.2);
            expect(rotation).toBeLessThanOrEqual(0.2);
        });
    });

    describe('validateConfig', () => {
        it('should validate correct configuration', () => {
            const config = {
                camera: { position: [0, 0, 0] },
                renderer: { type: 'WebGL' },
                scene: { background: '#000000' }
            };
            
            expect(validateConfig(config)).toBe(true);
        });

        it('should reject null or undefined config', () => {
            expect(validateConfig(null)).toBe(false);
            expect(validateConfig(undefined)).toBe(false);
        });

        it('should reject non-object config', () => {
            expect(validateConfig('string')).toBe(false);
            expect(validateConfig(123)).toBe(false);
            expect(validateConfig(true)).toBe(false);
        });

        it('should reject config missing camera', () => {
            const config = {
                renderer: { type: 'WebGL' },
                scene: { background: '#000000' }
            };
            
            expect(validateConfig(config)).toBe(false);
        });

        it('should reject config missing renderer', () => {
            const config = {
                camera: { position: [0, 0, 0] },
                scene: { background: '#000000' }
            };
            
            expect(validateConfig(config)).toBe(false);
        });

        it('should reject config missing scene', () => {
            const config = {
                camera: { position: [0, 0, 0] },
                renderer: { type: 'WebGL' }
            };
            
            expect(validateConfig(config)).toBe(false);
        });
    });

    describe('calculateCubeRotation', () => {
        it('should increment rotation by default value', () => {
            const result = calculateCubeRotation(0);
            expect(result).toBe(0.01);
        });

        it('should increment rotation by custom value', () => {
            const result = calculateCubeRotation(0, 0.05);
            expect(result).toBe(0.05);
        });

        it('should handle existing rotation values', () => {
            const result = calculateCubeRotation(1.5, 0.01);
            expect(result).toBeCloseTo(1.51, 2);
        });

        it('should handle negative increments', () => {
            const result = calculateCubeRotation(1.0, -0.01);
            expect(result).toBeCloseTo(0.99, 2);
        });

        it('should accumulate rotation over multiple calls', () => {
            let rotation = 0;
            rotation = calculateCubeRotation(rotation);
            rotation = calculateCubeRotation(rotation);
            rotation = calculateCubeRotation(rotation);
            
            expect(rotation).toBeCloseTo(0.03, 2);
        });
    });

    describe('validateColor', () => {
        it('should validate valid hex colors', () => {
            expect(validateColor(0x000000)).toBe(true);
            expect(validateColor(0xffffff)).toBe(true);
            expect(validateColor(0xff0000)).toBe(true);
            expect(validateColor(0x00ff00)).toBe(true);
            expect(validateColor(0x0000ff)).toBe(true);
        });

        it('should reject non-number values', () => {
            expect(validateColor('0xff0000')).toBe(false);
            expect(validateColor(null)).toBe(false);
            expect(validateColor(undefined)).toBe(false);
            expect(validateColor({})).toBe(false);
        });

        it('should reject out of range values', () => {
            expect(validateColor(-1)).toBe(false);
            expect(validateColor(0x1000000)).toBe(false);
        });

        it('should validate boundary values', () => {
            expect(validateColor(0x000000)).toBe(true);
            expect(validateColor(0xffffff)).toBe(true);
        });
    });
});
