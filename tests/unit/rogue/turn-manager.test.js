/**
 * Unit tests for turn manager
 */
import { describe, it, expect } from '@jest/globals';
import {
    createActionQueue,
    addAction,
    processNextAction,
    shouldAdvanceTurn,
    advanceTurn,
    checkTurnAdvancement
} from '../../../src/rogue/turn-manager.js';
import { createInitialState } from '../../../src/rogue/game-state.js';

describe('Turn Manager', () => {
    describe('createActionQueue', () => {
        it('should create empty action queue', () => {
            // Arrange & Act
            const queue = createActionQueue();
            
            // Assert
            expect(queue).toEqual([]);
        });
    });

    describe('addAction', () => {
        it('should add action to queue', () => {
            // Arrange
            const queue = createActionQueue();
            const action = { type: 'move', data: { x: 5, y: 5 } };
            
            // Act
            const newQueue = addAction(queue, action);
            
            // Assert
            expect(newQueue).toHaveLength(1);
            expect(newQueue[0]).toEqual(action);
        });

        it('should not modify original queue', () => {
            const queue = createActionQueue();
            const action = { type: 'attack', data: {} };
            
            const newQueue = addAction(queue, action);
            
            expect(queue).toHaveLength(0);
            expect(newQueue).toHaveLength(1);
        });

        it('should add multiple actions', () => {
            let queue = createActionQueue();
            
            queue = addAction(queue, { type: 'move', data: {} });
            queue = addAction(queue, { type: 'attack', data: {} });
            
            expect(queue).toHaveLength(2);
        });
    });

    describe('processNextAction', () => {
        it('should return null action for empty queue', () => {
            // Arrange
            const queue = createActionQueue();
            
            // Act
            const result = processNextAction(queue);
            
            // Assert
            expect(result.action).toBeNull();
            expect(result.newQueue).toEqual([]);
        });

        it('should process first action from queue', () => {
            const action1 = { type: 'move', data: {} };
            const action2 = { type: 'attack', data: {} };
            const queue = [action1, action2];
            
            const result = processNextAction(queue);
            
            expect(result.action).toEqual(action1);
            expect(result.newQueue).toHaveLength(1);
            expect(result.newQueue[0]).toEqual(action2);
        });

        it('should not modify original queue', () => {
            const action = { type: 'move', data: {} };
            const queue = [action];
            
            const result = processNextAction(queue);
            
            expect(queue).toHaveLength(1);
        });
    });

    describe('shouldAdvanceTurn', () => {
        it('should return true when threshold reached', () => {
            // Arrange
            const accumulatedMovement = 2.0;
            
            // Act
            const result = shouldAdvanceTurn(accumulatedMovement);
            
            // Assert
            expect(result).toBe(true);
        });

        it('should return true when threshold exceeded', () => {
            const result = shouldAdvanceTurn(3.5);
            
            expect(result).toBe(true);
        });

        it('should return false when below threshold', () => {
            const result = shouldAdvanceTurn(1.5);
            
            expect(result).toBe(false);
        });

        it('should use custom threshold', () => {
            const result = shouldAdvanceTurn(1.5, 1.0);
            
            expect(result).toBe(true);
        });
    });

    describe('advanceTurn', () => {
        it('should increment turn counter', () => {
            // Arrange
            const state = createInitialState();
            
            // Act
            const newState = advanceTurn(state);
            
            // Assert
            expect(newState.turnCount).toBe(1);
        });

        it('should decrease hunger', () => {
            const state = createInitialState();
            
            const newState = advanceTurn(state);
            
            expect(newState.player.hunger).toBe(999);
        });

        it('should reset accumulated movement', () => {
            const state = { ...createInitialState(), accumulatedMovement: 5.0 };
            
            const newState = advanceTurn(state);
            
            expect(newState.accumulatedMovement).toBe(0);
        });

        it('should process all turn effects together', () => {
            const state = { ...createInitialState(), accumulatedMovement: 3.0 };
            
            const newState = advanceTurn(state);
            
            expect(newState.turnCount).toBe(1);
            expect(newState.player.hunger).toBe(999);
            expect(newState.accumulatedMovement).toBe(0);
        });
    });

    describe('checkTurnAdvancement', () => {
        it('should return true when accumulated movement exceeds threshold', () => {
            // Arrange
            const state = { ...createInitialState(), accumulatedMovement: 2.5 };
            
            // Act
            const result = checkTurnAdvancement(state);
            
            // Assert
            expect(result).toBe(true);
        });

        it('should return false when below threshold', () => {
            const state = { ...createInitialState(), accumulatedMovement: 1.0 };
            
            const result = checkTurnAdvancement(state);
            
            expect(result).toBe(false);
        });
    });
});
