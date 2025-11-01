/**
 * Unit tests for visibility system
 */
import { describe, it, expect } from '@jest/globals';
import {
    computeVisibleTiles,
    updateExploredTiles,
    isTileVisible,
    isTileExplored,
    getTileVisibilityState,
    filterVisibleEntities,
    getEffectiveVisibilityRadius
} from '../../../src/rogue/visibility.js';
import { createStatusEffect, STATUS_TYPES } from '../../../src/rogue/status-effects.js';

describe('Visibility System', () => {
    describe('computeVisibleTiles', () => {
        it('should compute visible tiles within radius', () => {
            // Arrange
            const grid = Array(10).fill(null).map(() => Array(10).fill('floor'));
            const position = { x: 5, y: 5 };
            
            // Act
            const visible = computeVisibleTiles(grid, position, 5);
            
            // Assert
            expect(visible.size).toBeGreaterThan(0);
            expect(visible.has('5,5')).toBe(true);
        });

        it('should include position itself', () => {
            const grid = Array(10).fill(null).map(() => Array(10).fill('floor'));
            const position = { x: 3, y: 3 };
            
            const visible = computeVisibleTiles(grid, position);
            
            expect(visible.has('3,3')).toBe(true);
        });

        it('should not include tiles outside radius', () => {
            const grid = Array(20).fill(null).map(() => Array(20).fill('floor'));
            const position = { x: 10, y: 10 };
            
            const visible = computeVisibleTiles(grid, position, 2);
            
            // Position at distance 5 should not be visible with radius 2
            expect(visible.has('15,15')).toBe(false);
        });

        it('should handle edge positions', () => {
            const grid = Array(10).fill(null).map(() => Array(10).fill('floor'));
            const position = { x: 0, y: 0 };
            
            const visible = computeVisibleTiles(grid, position);
            
            expect(visible.has('0,0')).toBe(true);
            expect(visible.size).toBeGreaterThan(0);
        });

        it('should not include out of bounds tiles', () => {
            const grid = Array(5).fill(null).map(() => Array(5).fill('floor'));
            const position = { x: 2, y: 2 };
            
            const visible = computeVisibleTiles(grid, position, 10);
            
            // Should not have tiles outside grid
            expect(visible.has('10,10')).toBe(false);
            expect(visible.has('-1,-1')).toBe(false);
        });
    });

    describe('updateExploredTiles', () => {
        it('should add visible tiles to explored set', () => {
            // Arrange
            const exploredTiles = new Set(['1,1', '2,2']);
            const visibleTiles = new Set(['3,3', '4,4']);
            
            // Act
            const newExplored = updateExploredTiles(exploredTiles, visibleTiles);
            
            // Assert
            expect(newExplored.has('1,1')).toBe(true);
            expect(newExplored.has('3,3')).toBe(true);
            expect(newExplored.has('4,4')).toBe(true);
        });

        it('should not modify original set', () => {
            const exploredTiles = new Set(['1,1']);
            const visibleTiles = new Set(['2,2']);
            
            const newExplored = updateExploredTiles(exploredTiles, visibleTiles);
            
            expect(exploredTiles.size).toBe(1);
            expect(newExplored.size).toBe(2);
        });

        it('should handle duplicate tiles', () => {
            const exploredTiles = new Set(['1,1', '2,2']);
            const visibleTiles = new Set(['2,2', '3,3']);
            
            const newExplored = updateExploredTiles(exploredTiles, visibleTiles);
            
            expect(newExplored.size).toBe(3);
        });
    });

    describe('isTileVisible', () => {
        it('should return true for visible tile', () => {
            // Arrange
            const visibleTiles = new Set(['5,5', '6,6']);
            
            // Act & Assert
            expect(isTileVisible(visibleTiles, 5, 5)).toBe(true);
        });

        it('should return false for non-visible tile', () => {
            const visibleTiles = new Set(['5,5']);
            
            expect(isTileVisible(visibleTiles, 10, 10)).toBe(false);
        });
    });

    describe('isTileExplored', () => {
        it('should return true for explored tile', () => {
            // Arrange
            const exploredTiles = new Set(['7,7', '8,8']);
            
            // Act & Assert
            expect(isTileExplored(exploredTiles, 7, 7)).toBe(true);
        });

        it('should return false for unexplored tile', () => {
            const exploredTiles = new Set(['7,7']);
            
            expect(isTileExplored(exploredTiles, 1, 1)).toBe(false);
        });
    });

    describe('getTileVisibilityState', () => {
        it('should return "visible" for visible tile', () => {
            // Arrange
            const visibleTiles = new Set(['5,5']);
            const exploredTiles = new Set(['5,5', '6,6']);
            
            // Act
            const state = getTileVisibilityState(visibleTiles, exploredTiles, 5, 5);
            
            // Assert
            expect(state).toBe('visible');
        });

        it('should return "explored" for explored but not visible tile', () => {
            const visibleTiles = new Set(['1,1']);
            const exploredTiles = new Set(['1,1', '2,2']);
            
            const state = getTileVisibilityState(visibleTiles, exploredTiles, 2, 2);
            
            expect(state).toBe('explored');
        });

        it('should return "hidden" for unexplored tile', () => {
            const visibleTiles = new Set(['1,1']);
            const exploredTiles = new Set(['1,1']);
            
            const state = getTileVisibilityState(visibleTiles, exploredTiles, 5, 5);
            
            expect(state).toBe('hidden');
        });
    });

    describe('filterVisibleEntities', () => {
        it('should return only visible entities', () => {
            // Arrange
            const entities = [
                { id: 1, position: { x: 5, y: 5 } },
                { id: 2, position: { x: 10, y: 10 } },
                { id: 3, position: { x: 6, y: 6 } }
            ];
            const visibleTiles = new Set(['5,5', '6,6']);
            
            // Act
            const visible = filterVisibleEntities(entities, visibleTiles);
            
            // Assert
            expect(visible).toHaveLength(2);
            expect(visible.map(e => e.id)).toContain(1);
            expect(visible.map(e => e.id)).toContain(3);
            expect(visible.map(e => e.id)).not.toContain(2);
        });

        it('should return empty array when no entities visible', () => {
            const entities = [
                { id: 1, position: { x: 5, y: 5 } }
            ];
            const visibleTiles = new Set(['10,10']);
            
            const visible = filterVisibleEntities(entities, visibleTiles);
            
            expect(visible).toHaveLength(0);
        });

        it('should return all entities when all visible', () => {
            const entities = [
                { id: 1, position: { x: 1, y: 1 } },
                { id: 2, position: { x: 2, y: 2 } }
            ];
            const visibleTiles = new Set(['1,1', '2,2']);
            
            const visible = filterVisibleEntities(entities, visibleTiles);
            
            expect(visible).toHaveLength(2);
        });
    });

    describe('getEffectiveVisibilityRadius', () => {
        it('should return base radius when no sight effect', () => {
            // Arrange
            const effects = [];
            
            // Act
            const radius = getEffectiveVisibilityRadius(effects);
            
            // Assert
            expect(radius).toBe(5); // VISIBILITY_RADIUS default
        });

        it('should add magnitude to radius when sight effect is active', () => {
            // Arrange
            const sightEffect = createStatusEffect(STATUS_TYPES.SIGHT, 10, 5);
            const effects = [sightEffect];
            
            // Act
            const radius = getEffectiveVisibilityRadius(effects);
            
            // Assert
            expect(radius).toBe(10); // 5 + 5
        });

        it('should use custom base radius', () => {
            // Arrange
            const effects = [];
            
            // Act
            const radius = getEffectiveVisibilityRadius(effects, 8);
            
            // Assert
            expect(radius).toBe(8);
        });

        it('should add magnitude to custom base radius with sight effect', () => {
            // Arrange
            const sightEffect = createStatusEffect(STATUS_TYPES.SIGHT, 10, 3);
            const effects = [sightEffect];
            
            // Act
            const radius = getEffectiveVisibilityRadius(effects, 8);
            
            // Assert
            expect(radius).toBe(11); // 8 + 3
        });
    });
});
