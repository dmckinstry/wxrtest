/**
 * Unit tests for game state management
 */
import { describe, it, expect } from '@jest/globals';
import {
    createInitialState,
    updatePlayerPosition,
    updatePlayerWorldPosition,
    decreaseHunger,
    damagePlayer,
    healPlayer,
    addExperience,
    incrementTurn,
    setCombatMode,
    updateAccumulatedMovement,
    resetAccumulatedMovement,
    incrementKills,
    addGold
} from '../../../src/rogue/game-state.js';

describe('Game State', () => {
    describe('createInitialState', () => {
        it('should create initial state with default values', () => {
            // Arrange & Act
            const state = createInitialState();
            
            // Assert
            expect(state.player.hp).toBe(20);
            expect(state.player.maxHp).toBe(20);
            expect(state.player.hunger).toBe(1000);
            expect(state.player.level).toBe(1);
            expect(state.turnCount).toBe(0);
            expect(state.gameOver).toBe(false);
        });

        it('should use provided seed', () => {
            const seed = 12345;
            
            const state = createInitialState(seed);
            
            expect(state.seed).toBe(seed);
        });

        it('should initialize empty inventory', () => {
            const state = createInitialState();
            
            expect(state.inventory).toHaveLength(26);
            expect(state.inventory.every(slot => slot === null)).toBe(true);
        });
    });

    describe('updatePlayerPosition', () => {
        it('should update player grid position', () => {
            // Arrange
            const state = createInitialState();
            const newPosition = { x: 5, y: 7 };
            
            // Act
            const newState = updatePlayerPosition(state, newPosition);
            
            // Assert
            expect(newState.player.position).toEqual(newPosition);
            expect(state.player.position).toEqual({ x: 0, y: 0 }); // Original unchanged
        });
    });

    describe('updatePlayerWorldPosition', () => {
        it('should update player world position', () => {
            // Arrange
            const state = createInitialState();
            const newPosition = { x: 10, y: 1.6, z: 15 };
            
            // Act
            const newState = updatePlayerWorldPosition(state, newPosition);
            
            // Assert
            expect(newState.player.worldPosition).toEqual(newPosition);
        });
    });

    describe('decreaseHunger', () => {
        it('should decrease hunger by default amount', () => {
            // Arrange
            const state = createInitialState();
            
            // Act
            const newState = decreaseHunger(state);
            
            // Assert
            expect(newState.player.hunger).toBe(999);
        });

        it('should decrease hunger by custom amount', () => {
            const state = createInitialState();
            
            const newState = decreaseHunger(state, 50);
            
            expect(newState.player.hunger).toBe(950);
        });

        it('should not go below zero', () => {
            const state = createInitialState();
            
            const newState = decreaseHunger(state, 2000);
            
            expect(newState.player.hunger).toBe(0);
        });

        it('should trigger game over on starvation', () => {
            const state = { ...createInitialState(), player: { ...createInitialState().player, hunger: 1 } };
            
            const newState = decreaseHunger(state, 1);
            
            expect(newState.gameOver).toBe(true);
            expect(newState.deathMessage).toContain('starved');
            expect(newState.statistics.hungerDeaths).toBe(1);
        });
    });

    describe('damagePlayer', () => {
        it('should reduce player HP', () => {
            // Arrange
            const state = createInitialState();
            
            // Act
            const newState = damagePlayer(state, 5);
            
            // Assert
            expect(newState.player.hp).toBe(15);
        });

        it('should not go below zero', () => {
            const state = createInitialState();
            
            const newState = damagePlayer(state, 100);
            
            expect(newState.player.hp).toBe(0);
        });

        it('should trigger game over on death', () => {
            const state = createInitialState();
            
            const newState = damagePlayer(state, 20);
            
            expect(newState.gameOver).toBe(true);
            expect(newState.deathMessage).toContain('slain');
            expect(newState.statistics.combatDeaths).toBe(1);
        });
    });

    describe('healPlayer', () => {
        it('should restore player HP', () => {
            // Arrange
            const state = { ...createInitialState(), player: { ...createInitialState().player, hp: 10 } };
            
            // Act
            const newState = healPlayer(state, 5);
            
            // Assert
            expect(newState.player.hp).toBe(15);
        });

        it('should not exceed max HP', () => {
            const state = { ...createInitialState(), player: { ...createInitialState().player, hp: 18 } };
            
            const newState = healPlayer(state, 10);
            
            expect(newState.player.hp).toBe(20);
        });
    });

    describe('addExperience', () => {
        it('should add XP without leveling', () => {
            // Arrange
            const state = createInitialState();
            
            // Act
            const newState = addExperience(state, 50);
            
            // Assert
            expect(newState.player.xp).toBe(50);
            expect(newState.player.level).toBe(1);
        });

        it('should level up when XP threshold reached', () => {
            const state = createInitialState();
            
            const newState = addExperience(state, 100);
            
            expect(newState.player.level).toBe(2);
            expect(newState.player.xp).toBe(0);
        });

        it('should increase max HP on level up', () => {
            const state = createInitialState();
            
            const newState = addExperience(state, 100);
            
            expect(newState.player.maxHp).toBe(25);
        });

        it('should heal on level up', () => {
            const state = { ...createInitialState(), player: { ...createInitialState().player, hp: 15 } };
            
            const newState = addExperience(state, 100);
            
            expect(newState.player.hp).toBe(20);
        });

        it('should increase attack bonus on level up', () => {
            const state = createInitialState();
            
            const newState = addExperience(state, 100);
            
            expect(newState.player.attackBonus).toBe(1);
        });

        it('should handle multiple levels', () => {
            const state = createInitialState();
            
            const newState = addExperience(state, 250);
            
            expect(newState.player.level).toBe(3);
            expect(newState.player.xp).toBe(0);
        });
    });

    describe('incrementTurn', () => {
        it('should increment turn counter', () => {
            // Arrange
            const state = createInitialState();
            
            // Act
            const newState = incrementTurn(state);
            
            // Assert
            expect(newState.turnCount).toBe(1);
            expect(newState.statistics.turnsPlayed).toBe(1);
        });
    });

    describe('setCombatMode', () => {
        it('should set combat mode to true', () => {
            // Arrange
            const state = createInitialState();
            
            // Act
            const newState = setCombatMode(state, true);
            
            // Assert
            expect(newState.inCombatMode).toBe(true);
        });

        it('should set combat mode to false', () => {
            const state = { ...createInitialState(), inCombatMode: true };
            
            const newState = setCombatMode(state, false);
            
            expect(newState.inCombatMode).toBe(false);
        });
    });

    describe('updateAccumulatedMovement', () => {
        it('should add to accumulated movement', () => {
            // Arrange
            const state = createInitialState();
            
            // Act
            const newState = updateAccumulatedMovement(state, 1.5);
            
            // Assert
            expect(newState.accumulatedMovement).toBe(1.5);
        });

        it('should accumulate over multiple updates', () => {
            let state = createInitialState();
            
            state = updateAccumulatedMovement(state, 0.5);
            state = updateAccumulatedMovement(state, 0.8);
            
            expect(state.accumulatedMovement).toBeCloseTo(1.3);
        });
    });

    describe('resetAccumulatedMovement', () => {
        it('should reset accumulated movement to zero', () => {
            // Arrange
            const state = { ...createInitialState(), accumulatedMovement: 5.0 };
            
            // Act
            const newState = resetAccumulatedMovement(state);
            
            // Assert
            expect(newState.accumulatedMovement).toBe(0);
        });
    });

    describe('incrementKills', () => {
        it('should increment kill counter', () => {
            // Arrange
            const state = createInitialState();
            
            // Act
            const newState = incrementKills(state);
            
            // Assert
            expect(newState.statistics.kills).toBe(1);
        });
    });

    describe('addGold', () => {
        it('should add gold to statistics', () => {
            // Arrange
            const state = createInitialState();
            
            // Act
            const newState = addGold(state, 100);
            
            // Assert
            expect(newState.statistics.goldCollected).toBe(100);
        });
    });
});
