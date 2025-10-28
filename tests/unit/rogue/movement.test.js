/**
 * Unit tests for movement system
 */
import { describe, it, expect } from '@jest/globals';
import {
    readJoystickAxes,
    calculateMovementDelta,
    calculateMovementDistance,
    detectCombatMode,
    calculateMovementBudget,
    checkCollision
} from '../../../src/rogue/movement.js';

describe('Movement System', () => {
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
            
            const result = calculateMovementDelta(axes, deltaTime, 2.0);
            
            expect(result.dx).toBeCloseTo(1.0);
            expect(result.dz).toBeCloseTo(0.5);
        });

        it('should scale by speed', () => {
            const axes = { x: 1.0, y: 0.0 };
            const deltaTime = 1.0;
            
            const result = calculateMovementDelta(axes, deltaTime, 5.0);
            
            expect(result.dx).toBeCloseTo(5.0);
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
});
