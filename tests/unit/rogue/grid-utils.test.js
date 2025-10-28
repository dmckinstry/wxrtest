/**
 * Unit tests for grid utility functions
 */
import { describe, it, expect } from '@jest/globals';
import {
    worldToGrid,
    gridToWorld,
    distance,
    manhattanDistance,
    getAdjacentPositions,
    isWalkable,
    findPath,
    getTilesInRadius
} from '../../../src/rogue/grid-utils.js';

describe('Grid Utils', () => {
    describe('worldToGrid', () => {
        it('should convert world coordinates to grid coordinates', () => {
            // Arrange
            const x = 5;
            const z = 7;
            
            // Act
            const result = worldToGrid(x, z);
            
            // Assert
            expect(result).toEqual({ x: 2, y: 3 });
        });

        it('should handle negative coordinates', () => {
            const result = worldToGrid(-3, -5);
            
            expect(result).toEqual({ x: -2, y: -3 });
        });

        it('should handle zero coordinates', () => {
            const result = worldToGrid(0, 0);
            
            expect(result).toEqual({ x: 0, y: 0 });
        });
    });

    describe('gridToWorld', () => {
        it('should convert grid coordinates to world coordinates', () => {
            // Arrange
            const gridX = 2;
            const gridY = 3;
            
            // Act
            const result = gridToWorld(gridX, gridY);
            
            // Assert
            expect(result).toEqual({ x: 5, z: 7 });
        });

        it('should return center of tile', () => {
            const result = gridToWorld(0, 0);
            
            expect(result).toEqual({ x: 1, z: 1 });
        });

        it('should handle negative grid coordinates', () => {
            const result = gridToWorld(-1, -1);
            
            expect(result).toEqual({ x: -1, z: -1 });
        });
    });

    describe('distance', () => {
        it('should calculate Euclidean distance', () => {
            // Arrange
            const x1 = 0, y1 = 0;
            const x2 = 3, y2 = 4;
            
            // Act
            const result = distance(x1, y1, x2, y2);
            
            // Assert
            expect(result).toBe(5);
        });

        it('should return zero for same point', () => {
            const result = distance(5, 5, 5, 5);
            
            expect(result).toBe(0);
        });

        it('should handle negative coordinates', () => {
            const result = distance(-3, -4, 0, 0);
            
            expect(result).toBe(5);
        });
    });

    describe('manhattanDistance', () => {
        it('should calculate Manhattan distance', () => {
            // Arrange
            const x1 = 0, y1 = 0;
            const x2 = 3, y2 = 4;
            
            // Act
            const result = manhattanDistance(x1, y1, x2, y2);
            
            // Assert
            expect(result).toBe(7);
        });

        it('should return zero for same point', () => {
            const result = manhattanDistance(5, 5, 5, 5);
            
            expect(result).toBe(0);
        });

        it('should handle negative differences', () => {
            const result = manhattanDistance(5, 5, 2, 3);
            
            expect(result).toBe(5);
        });
    });

    describe('getAdjacentPositions', () => {
        it('should return 4 adjacent positions', () => {
            // Arrange
            const x = 5, y = 5;
            
            // Act
            const result = getAdjacentPositions(x, y);
            
            // Assert
            expect(result).toHaveLength(4);
            expect(result).toContainEqual({ x: 6, y: 5 });
            expect(result).toContainEqual({ x: 4, y: 5 });
            expect(result).toContainEqual({ x: 5, y: 6 });
            expect(result).toContainEqual({ x: 5, y: 4 });
        });

        it('should handle zero coordinates', () => {
            const result = getAdjacentPositions(0, 0);
            
            expect(result).toContainEqual({ x: 1, y: 0 });
            expect(result).toContainEqual({ x: -1, y: 0 });
            expect(result).toContainEqual({ x: 0, y: 1 });
            expect(result).toContainEqual({ x: 0, y: -1 });
        });
    });

    describe('isWalkable', () => {
        it('should return true for floor tile', () => {
            // Arrange
            const grid = [
                ['wall', 'wall', 'wall'],
                ['wall', 'floor', 'wall'],
                ['wall', 'wall', 'wall']
            ];
            
            // Act
            const result = isWalkable(grid, 1, 1);
            
            // Assert
            expect(result).toBe(true);
        });

        it('should return false for wall tile', () => {
            const grid = [
                ['wall', 'wall', 'wall'],
                ['wall', 'floor', 'wall'],
                ['wall', 'wall', 'wall']
            ];
            
            const result = isWalkable(grid, 0, 0);
            
            expect(result).toBe(false);
        });

        it('should return true for door tile', () => {
            const grid = [
                ['wall', 'door', 'wall'],
                ['wall', 'floor', 'wall'],
                ['wall', 'wall', 'wall']
            ];
            
            const result = isWalkable(grid, 1, 0);
            
            expect(result).toBe(true);
        });

        it('should return false for out of bounds', () => {
            const grid = [
                ['wall', 'floor', 'wall']
            ];
            
            expect(isWalkable(grid, 5, 5)).toBe(false);
            expect(isWalkable(grid, -1, 0)).toBe(false);
            expect(isWalkable(grid, 0, -1)).toBe(false);
        });

        it('should return false for null grid', () => {
            expect(isWalkable(null, 0, 0)).toBe(false);
        });
    });

    describe('findPath', () => {
        it('should find direct path', () => {
            // Arrange
            const grid = [
                ['floor', 'floor', 'floor'],
                ['floor', 'floor', 'floor'],
                ['floor', 'floor', 'floor']
            ];
            const start = { x: 0, y: 0 };
            const goal = { x: 2, y: 0 };
            
            // Act
            const result = findPath(grid, start, goal);
            
            // Assert
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ x: 1, y: 0 });
            expect(result[1]).toEqual({ x: 2, y: 0 });
        });

        it('should find path around obstacle', () => {
            const grid = [
                ['floor', 'floor', 'floor'],
                ['floor', 'wall', 'floor'],
                ['floor', 'floor', 'floor']
            ];
            const start = { x: 0, y: 1 };
            const goal = { x: 2, y: 1 };
            
            const result = findPath(grid, start, goal);
            
            expect(result.length).toBeGreaterThan(2);
            expect(result[result.length - 1]).toEqual(goal);
        });

        it('should return empty array when no path exists', () => {
            const grid = [
                ['floor', 'wall', 'floor'],
                ['wall', 'wall', 'wall'],
                ['floor', 'wall', 'floor']
            ];
            const start = { x: 0, y: 0 };
            const goal = { x: 2, y: 2 };
            
            const result = findPath(grid, start, goal);
            
            expect(result).toEqual([]);
        });

        it('should return empty array when goal is not walkable', () => {
            const grid = [
                ['floor', 'floor', 'wall']
            ];
            const start = { x: 0, y: 0 };
            const goal = { x: 2, y: 0 };
            
            const result = findPath(grid, start, goal);
            
            expect(result).toEqual([]);
        });
    });

    describe('getTilesInRadius', () => {
        it('should return tiles within radius', () => {
            // Arrange
            const centerX = 0, centerY = 0;
            const radius = 1;
            
            // Act
            const result = getTilesInRadius(centerX, centerY, radius);
            
            // Assert
            expect(result.length).toBeGreaterThan(0);
            expect(result).toContainEqual({ x: 0, y: 0 });
            expect(result).toContainEqual({ x: 1, y: 0 });
            expect(result).toContainEqual({ x: 0, y: 1 });
        });

        it('should not include tiles outside radius', () => {
            const result = getTilesInRadius(0, 0, 1);
            
            // (2, 0) is outside radius 1
            expect(result).not.toContainEqual({ x: 2, y: 0 });
        });

        it('should handle radius of 0', () => {
            const result = getTilesInRadius(5, 5, 0);
            
            expect(result).toEqual([{ x: 5, y: 5 }]);
        });

        it('should handle larger radius', () => {
            const result = getTilesInRadius(0, 0, 2);
            
            expect(result.length).toBeGreaterThan(9);
            expect(result).toContainEqual({ x: 0, y: 0 });
            expect(result).toContainEqual({ x: 2, y: 0 });
            expect(result).toContainEqual({ x: 0, y: 2 });
        });
    });
});
