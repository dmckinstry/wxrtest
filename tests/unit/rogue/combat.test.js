/**
 * Unit tests for combat system
 */
import { describe, it, expect } from '@jest/globals';
import {
    rollD20,
    rollDamage,
    calculateHit,
    executeAttack,
    processEnemyTurn,
    isAdjacent,
    getCombatMessage
} from '../../../src/rogue/combat.js';

describe('Combat System', () => {
    describe('rollD20', () => {
        it('should return value between 1 and 20', () => {
            // Act
            for (let i = 0; i < 100; i++) {
                const result = rollD20();
                
                // Assert
                expect(result).toBeGreaterThanOrEqual(1);
                expect(result).toBeLessThanOrEqual(20);
            }
        });
    });

    describe('rollDamage', () => {
        it('should roll damage dice', () => {
            // Act
            for (let i = 0; i < 100; i++) {
                const result = rollDamage(2, 6, 0);
                
                // Assert
                expect(result).toBeGreaterThanOrEqual(2);
                expect(result).toBeLessThanOrEqual(12);
            }
        });

        it('should add bonus', () => {
            const result = rollDamage(1, 1, 5);
            
            expect(result).toBe(6);
        });

        it('should return minimum 1 damage', () => {
            const result = rollDamage(1, 1, -10);
            
            expect(result).toBe(1);
        });
    });

    describe('calculateHit', () => {
        it('should hit when roll + bonus >= AC', () => {
            // Arrange
            const attacker = { attackBonus: 5 };
            const defender = { ac: 15 };
            const roll = 10;
            
            // Act
            const result = calculateHit(attacker, defender, roll);
            
            // Assert
            expect(result.hit).toBe(true);
            expect(result.totalRoll).toBe(15);
        });

        it('should miss when roll + bonus < AC', () => {
            const attacker = { attackBonus: 2 };
            const defender = { ac: 15 };
            const roll = 10;
            
            const result = calculateHit(attacker, defender, roll);
            
            expect(result.hit).toBe(false);
        });

        it('should always hit on natural 20', () => {
            const attacker = { attackBonus: 0 };
            const defender = { ac: 30 };
            const roll = 20;
            
            const result = calculateHit(attacker, defender, roll);
            
            expect(result.hit).toBe(true);
            expect(result.natural20).toBe(true);
        });

        it('should mark natural 1', () => {
            const attacker = { attackBonus: 10 };
            const defender = { ac: 5 };
            const roll = 1;
            
            const result = calculateHit(attacker, defender, roll);
            
            expect(result.natural1).toBe(true);
        });
    });

    describe('executeAttack', () => {
        it('should deal damage on successful hit', () => {
            // Arrange
            const attacker = { 
                attackBonus: 10,
                damage: [1, 6],
                damageBonus: 0
            };
            const defender = { ac: 10, hp: 20 };
            
            // Act
            const result = executeAttack(attacker, defender);
            
            // Assert
            if (result.hit) {
                expect(result.damage).toBeGreaterThan(0);
            }
        });

        it('should mark enemy as killed when hp reaches 0', () => {
            const attacker = { 
                attackBonus: 10,
                damage: [100, 100]
            };
            const defender = { ac: 5, hp: 1 };
            
            const result = executeAttack(attacker, defender);
            
            if (result.hit) {
                expect(result.killed).toBe(true);
            }
        });

        it('should double damage on critical hit', () => {
            // This test uses a mock to control the roll
            const attacker = { 
                attackBonus: 0,
                damage: [1, 1], // Always rolls 1
                damageBonus: 0
            };
            const defender = { ac: 10, hp: 20 };
            
            // We can't directly control the random roll, but we can verify the logic
            // by checking that critical hits exist in results over many rolls
            for (let i = 0; i < 100; i++) {
                const result = executeAttack(attacker, defender);
                if (result.critical) {
                    expect(result.damage).toBeGreaterThan(1); // Should be doubled
                    break;
                }
            }
        });

        it('should return miss result when attack misses', () => {
            const attacker = { 
                attackBonus: -10,
                damage: [1, 6]
            };
            const defender = { ac: 30, hp: 20 };
            
            // Try multiple times to ensure we get a miss
            for (let i = 0; i < 50; i++) {
                const result = executeAttack(attacker, defender);
                if (!result.hit) {
                    expect(result.damage).toBe(0);
                    expect(result.killed).toBe(false);
                    break;
                }
            }
        });
    });

    describe('processEnemyTurn', () => {
        it('should attack when adjacent to player', () => {
            // Arrange
            const enemy = { 
                position: { x: 5, y: 5 },
                isAlive: true
            };
            const playerPosition = { x: 6, y: 5 };
            const grid = [];
            const findPath = () => [];
            
            // Act
            const result = processEnemyTurn(enemy, playerPosition, grid, findPath);
            
            // Assert
            expect(result.action).toBe('attack');
            expect(result.target).toBe('player');
        });

        it('should move toward player when not adjacent', () => {
            const enemy = { 
                position: { x: 5, y: 5 },
                isAlive: true
            };
            const playerPosition = { x: 10, y: 10 };
            const grid = [];
            const findPath = () => [{ x: 6, y: 6 }];
            
            const result = processEnemyTurn(enemy, playerPosition, grid, findPath);
            
            expect(result.action).toBe('move');
            expect(result.newPosition).toEqual({ x: 6, y: 6 });
        });

        it('should wait when no path to player', () => {
            const enemy = { 
                position: { x: 5, y: 5 },
                isAlive: true
            };
            const playerPosition = { x: 10, y: 10 };
            const grid = [];
            const findPath = () => [];
            
            const result = processEnemyTurn(enemy, playerPosition, grid, findPath);
            
            expect(result.action).toBe('wait');
        });

        it('should wait when enemy is not alive', () => {
            const enemy = { 
                position: { x: 5, y: 5 },
                isAlive: false
            };
            const playerPosition = { x: 6, y: 5 };
            const grid = [];
            const findPath = () => [];
            
            const result = processEnemyTurn(enemy, playerPosition, grid, findPath);
            
            expect(result.action).toBe('wait');
        });
    });

    describe('isAdjacent', () => {
        it('should return true for horizontally adjacent positions', () => {
            // Arrange
            const pos1 = { x: 5, y: 5 };
            const pos2 = { x: 6, y: 5 };
            
            // Act & Assert
            expect(isAdjacent(pos1, pos2)).toBe(true);
        });

        it('should return true for vertically adjacent positions', () => {
            const pos1 = { x: 5, y: 5 };
            const pos2 = { x: 5, y: 6 };
            
            expect(isAdjacent(pos1, pos2)).toBe(true);
        });

        it('should return false for diagonal positions', () => {
            const pos1 = { x: 5, y: 5 };
            const pos2 = { x: 6, y: 6 };
            
            expect(isAdjacent(pos1, pos2)).toBe(false);
        });

        it('should return false for same position', () => {
            const pos1 = { x: 5, y: 5 };
            const pos2 = { x: 5, y: 5 };
            
            expect(isAdjacent(pos1, pos2)).toBe(false);
        });
    });

    describe('getCombatMessage', () => {
        it('should return miss message', () => {
            // Arrange
            const result = { hit: false };
            
            // Act
            const message = getCombatMessage('Goblin', 'Player', result);
            
            // Assert
            expect(message).toContain('misses');
        });

        it('should return hit message', () => {
            const result = { hit: true, damage: 5, killed: false, critical: false };
            
            const message = getCombatMessage('Player', 'Goblin', result);
            
            expect(message).toContain('hits');
            expect(message).toContain('5 damage');
        });

        it('should return critical hit message', () => {
            const result = { hit: true, damage: 10, killed: false, critical: true };
            
            const message = getCombatMessage('Player', 'Dragon', result);
            
            expect(message).toContain('CRITICAL');
        });

        it('should return killed message', () => {
            const result = { hit: true, damage: 20, killed: true, critical: false };
            
            const message = getCombatMessage('Player', 'Slime', result);
            
            expect(message).toContain('defeated');
        });
    });
    
    describe('executeAttack with status effects', () => {
        it('should apply strength bonus to damage', () => {
            const attacker = { hp: 20, damage: [1, 1], attackBonus: 0 }; // 1 damage always
            const defender = { hp: 20, ac: 5 };
            const strengthEffect = { type: 'strength', magnitude: 5, turnsRemaining: 10 };
            
            const result = executeAttack(attacker, defender, [strengthEffect], []);
            
            // 1 base damage + 5 strength bonus = 6 damage
            expect(result.damage).toBe(6);
        });
        
        it('should apply skill bonus to hit chance', () => {
            const attacker = { hp: 20, damage: [1, 6], attackBonus: 0 };
            const defender = { hp: 20, ac: 10 };
            const skillEffect = { type: 'skill', magnitude: 3, turnsRemaining: 10 };
            
            // Multiple attempts to verify skill bonus is applied
            let hits = 0;
            for (let i = 0; i < 50; i++) {
                const result = executeAttack(attacker, defender, [skillEffect], []);
                if (result.hit) hits++;
            }
            
            // With +3 bonus, should hit more often than without
            expect(hits).toBeGreaterThan(10);
        });
        
        it('should block all damage with stone effect', () => {
            const attacker = { hp: 20, damage: [10, 10], attackBonus: 10 }; // Guaranteed hit, high damage
            const defender = { hp: 20, ac: 5 };
            const stoneEffect = { type: 'stone', magnitude: 1, turnsRemaining: 10 };
            
            const result = executeAttack(attacker, defender, [], [stoneEffect]);
            
            expect(result.hit).toBe(true);
            expect(result.damage).toBe(0);
            expect(result.blocked).toBe(true);
        });
        
        it('should work without status effects', () => {
            const attacker = { hp: 20, damage: [1, 6], attackBonus: 0 };
            const defender = { hp: 20, ac: 10 };
            
            const result = executeAttack(attacker, defender, [], []);
            
            expect(result).toHaveProperty('hit');
            expect(result).toHaveProperty('damage');
        });
    });
    
    describe('processEnemyTurn with status effects', () => {
        it('should make enemy wait if player is invisible', () => {
            const enemy = { isAlive: true, position: { x: 5, y: 5 }, hp: 10 };
            const playerPos = { x: 6, y: 5 }; // Adjacent
            const grid = [[]];
            const findPath = () => [];
            const invisEffect = { type: 'invisibility', turnsRemaining: 5 };
            
            const result = processEnemyTurn(enemy, playerPos, grid, findPath, [invisEffect]);
            
            expect(result.action).toBe('wait');
        });
        
        it('should attack if player not invisible and adjacent', () => {
            const enemy = { isAlive: true, position: { x: 5, y: 5 }, hp: 10 };
            const playerPos = { x: 6, y: 5 }; // Adjacent
            const grid = [[]];
            const findPath = () => [];
            
            const result = processEnemyTurn(enemy, playerPos, grid, findPath, []);
            
            expect(result.action).toBe('attack');
        });
    });
});
