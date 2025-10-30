/**
 * Unit tests for movement system
 */
import { describe, it, expect } from '@jest/globals';
import {
    readJoystickAxes,
    readKeyboardAxes,
    calculateMovementDelta,
    calculateMovementDistance,
    calculateRotationDelta,
    detectCombatMode,
    calculateMovementBudget,
    checkCollision,
    calculateCameraRotation,
    clampPitch
} from '../../../src/rogue/movement.js';

describe('Movement System', () => {
    describe('readKeyboardAxes', () => {
        it('should return zero axes for null keyStates', () => {
            // Arrange & Act
            const result = readKeyboardAxes(null);
            
            // Assert
            expect(result).toEqual({ x: 0, y: 0 });
        });

        it('should return zero axes for empty keyStates', () => {
            const result = readKeyboardAxes({});
            
            expect(result).toEqual({ x: 0, y: 0 });
        });

        it('should read W key for forward movement', () => {
            const keyStates = { 'KeyW': true };
            
            const result = readKeyboardAxes(keyStates);
            
            expect(result).toEqual({ x: 0, y: -1 });
        });

        it('should read S key for backward movement', () => {
            const keyStates = { 'KeyS': true };
            
            const result = readKeyboardAxes(keyStates);
            
            expect(result).toEqual({ x: 0, y: 1 });
        });

        it('should read A key for left movement', () => {
            const keyStates = { 'KeyA': true };
            
            const result = readKeyboardAxes(keyStates);
            
            expect(result).toEqual({ x: -1, y: 0 });
        });

        it('should read D key for right movement', () => {
            const keyStates = { 'KeyD': true };
            
            const result = readKeyboardAxes(keyStates);
            
            expect(result).toEqual({ x: 1, y: 0 });
        });

        it('should read arrow keys for movement and rotation', () => {
            const keyStates = { 'ArrowUp': true, 'ArrowRight': true };
            
            const result = readKeyboardAxes(keyStates);
            
            // Arrow right is now handled in index.html for rotation, so not read here
            expect(result).toEqual({ x: 0, y: -1 });
        });

        it('should combine multiple keys', () => {
            const keyStates = { 'KeyW': true, 'KeyD': true };
            
            const result = readKeyboardAxes(keyStates);
            
            expect(result).toEqual({ x: 1, y: -1 });
        });
    });

    describe('readJoystickAxes', () => {
        it('should return zero axes for null controller', () => {
            // Arrange & Act
            const result = readJoystickAxes(null);
            
            // Assert
            expect(result).toEqual({ x: 0, y: 0 });
        });

        it('should return zero axes for controller without gamepad', () => {
            const controller = {};
            
            const result = readJoystickAxes(controller);
            
            expect(result).toEqual({ x: 0, y: 0 });
        });

        it('should read axes from gamepad', () => {
            const controller = {
                gamepad: {
                    axes: [0, 0, 0.5, -0.7]
                }
            };
            
            const result = readJoystickAxes(controller);
            
            expect(result).toEqual({ x: 0.5, y: -0.7 });
        });
    });

    describe('calculateMovementDelta', () => {
        it('should apply deadzone to small inputs', () => {
            // Arrange
            const axes = { x: 0.1, y: 0.1 };
            
            // Act
            const result = calculateMovementDelta(axes, 1.0);
            
            // Assert
            expect(result.dx).toBe(0);
            expect(result.dz).toBe(0);
        });

        it('should calculate movement delta for valid input', () => {
            const axes = { x: 1.0, y: 0.5 };
            const deltaTime = 0.5;
            
            const result = calculateMovementDelta(axes, deltaTime, 2.0, 0); // yaw = 0
            
            expect(result.dx).toBeCloseTo(1.0);
            expect(result.dz).toBeCloseTo(-0.5); // forward is negative
        });

        it('should scale by speed', () => {
            const axes = { x: 1.0, y: 0.0 };
            const deltaTime = 1.0;
            
            const result = calculateMovementDelta(axes, deltaTime, 5.0, 0); // yaw = 0
            
            expect(result.dx).toBeCloseTo(5.0);
        });
        
        it('should apply rotation transformation', () => {
            const axes = { x: 0, y: -1.0 }; // Forward
            const deltaTime = 1.0;
            const yaw = Math.PI / 2; // 90 degrees
            
            const result = calculateMovementDelta(axes, deltaTime, 2.0, yaw);
            
            // At 90 degrees, forward should move in +x direction
            expect(result.dx).toBeCloseTo(-2.0, 1);
            expect(result.dz).toBeCloseTo(0, 1);
        });
    });

    describe('calculateMovementDistance', () => {
        it('should calculate distance from delta', () => {
            // Arrange
            const delta = { dx: 3, dz: 4 };
            
            // Act
            const result = calculateMovementDistance(delta);
            
            // Assert
            expect(result).toBe(5);
        });

        it('should return zero for no movement', () => {
            const delta = { dx: 0, dz: 0 };
            
            const result = calculateMovementDistance(delta);
            
            expect(result).toBe(0);
        });
    });

    describe('calculateRotationDelta', () => {
        it('should calculate rotation delta', () => {
            const rotationInput = 1.0;
            const deltaTime = 1.0;
            const rotationSpeed = Math.PI;
            
            const result = calculateRotationDelta(rotationInput, deltaTime, rotationSpeed);
            
            expect(result).toBeCloseTo(Math.PI);
        });

        it('should return zero for no rotation input', () => {
            const result = calculateRotationDelta(0, 1.0);
            
            expect(result).toBe(0);
        });
        
        it('should scale by deltaTime', () => {
            const result = calculateRotationDelta(1.0, 0.5, Math.PI);
            
            expect(result).toBeCloseTo(Math.PI / 2);
        });
    });

    describe('detectCombatMode', () => {
        it('should return true when enemy within radius', () => {
            // Arrange
            const playerPos = { x: 5, y: 0, z: 5 };
            const enemies = [
                { position: { x: 8, z: 5 } }
            ];
            
            // Act
            const result = detectCombatMode(playerPos, enemies, 10);
            
            // Assert
            expect(result).toBe(true);
        });

        it('should return false when no enemies nearby', () => {
            const playerPos = { x: 5, y: 0, z: 5 };
            const enemies = [
                { position: { x: 50, z: 50 } }
            ];
            
            const result = detectCombatMode(playerPos, enemies, 10);
            
            expect(result).toBe(false);
        });

        it('should return false for empty enemy list', () => {
            const playerPos = { x: 5, y: 0, z: 5 };
            const enemies = [];
            
            const result = detectCombatMode(playerPos, enemies);
            
            expect(result).toBe(false);
        });
    });

    describe('calculateMovementBudget', () => {
        it('should return full budget when no movement', () => {
            // Arrange
            const accumulated = 0;
            
            // Act
            const result = calculateMovementBudget(accumulated);
            
            // Assert
            expect(result).toBe(1.0);
        });

        it('should return partial budget for partial movement', () => {
            const accumulated = 1.0;
            const threshold = 2.0;
            
            const result = calculateMovementBudget(accumulated, threshold);
            
            expect(result).toBe(0.5);
        });

        it('should return zero when budget exhausted', () => {
            const accumulated = 3.0;
            const threshold = 2.0;
            
            const result = calculateMovementBudget(accumulated, threshold);
            
            expect(result).toBe(0);
        });
    });

    describe('checkCollision', () => {
        it('should return true for walkable tile', () => {
            // Arrange
            const newPosition = { x: 3, y: 0, z: 3 }; // Maps to grid[1][1]
            const grid = [
                ['wall', 'wall', 'wall'],
                ['wall', 'floor', 'wall'],
                ['wall', 'wall', 'wall']
            ];
            const worldToGrid = (x, z) => ({ x: Math.floor(x / 2), y: Math.floor(z / 2) });
            const isWalkable = (grid, x, y) => grid[y] && grid[y][x] === 'floor';
            
            // Act
            const result = checkCollision(newPosition, grid, worldToGrid, isWalkable);
            
            // Assert
            expect(result).toBe(true);
        });

        it('should return false for wall tile', () => {
            const newPosition = { x: 1, y: 0, z: 1 };
            const grid = [
                ['wall', 'wall'],
                ['wall', 'floor']
            ];
            const worldToGrid = (x, z) => ({ x: Math.floor(x / 2), y: Math.floor(z / 2) });
            const isWalkable = (grid, x, y) => grid[y] && grid[y][x] === 'floor';
            
            const result = checkCollision(newPosition, grid, worldToGrid, isWalkable);
            
            expect(result).toBe(false);
        });
    });

    describe('calculateCameraRotation', () => {
        it('should calculate yaw and pitch from mouse delta', () => {
            // Arrange
            const deltaX = 100;
            const deltaY = 50;
            
            // Act
            const result = calculateCameraRotation(deltaX, deltaY);
            
            // Assert
            expect(result.yaw).toBeCloseTo(-0.2);
            expect(result.pitch).toBeCloseTo(-0.1);
        });

        it('should scale by sensitivity', () => {
            const deltaX = 100;
            const deltaY = 50;
            
            const result = calculateCameraRotation(deltaX, deltaY, 0.001);
            
            expect(result.yaw).toBeCloseTo(-0.1);
            expect(result.pitch).toBeCloseTo(-0.05);
        });

        it('should return zero for zero mouse movement', () => {
            const result = calculateCameraRotation(0, 0);
            
            expect(Math.abs(result.yaw)).toBe(0);
            expect(Math.abs(result.pitch)).toBe(0);
        });
    });

    describe('clampPitch', () => {
        it('should clamp pitch to maximum', () => {
            // Arrange
            const pitch = Math.PI;
            
            // Act
            const result = clampPitch(pitch);
            
            // Assert
            expect(result).toBeCloseTo(Math.PI / 2);
        });

        it('should clamp pitch to minimum', () => {
            const pitch = -Math.PI;
            
            const result = clampPitch(pitch);
            
            expect(result).toBeCloseTo(-Math.PI / 2);
        });

        it('should not clamp pitch within range', () => {
            const pitch = Math.PI / 4;
            
            const result = clampPitch(pitch);
            
            expect(result).toBeCloseTo(Math.PI / 4);
        });

        it('should respect custom min/max', () => {
            const pitch = -1.5;
            
            const result = clampPitch(pitch, -1.0, 1.0);
            
            expect(result).toBe(-1.0);
        });
    });
});
