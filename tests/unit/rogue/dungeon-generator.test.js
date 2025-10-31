/**
 * Unit tests for dungeon generator
 */
import { describe, it, expect } from '@jest/globals';
import {
    generateDungeon,
    getPlayerStartPosition,
    SeededRandom
} from '../../../src/rogue/dungeon-generator.js';

describe('Dungeon Generator', () => {
    describe('SeededRandom', () => {
        it('should generate consistent random numbers with same seed', () => {
            // Arrange
            const seed = 12345;
            const rng1 = new SeededRandom(seed);
            const rng2 = new SeededRandom(seed);
            
            // Act
            const val1 = rng1.next();
            const val2 = rng2.next();
            
            // Assert
            expect(val1).toBe(val2);
        });

        it('should generate different numbers with different seeds', () => {
            const rng1 = new SeededRandom(12345);
            const rng2 = new SeededRandom(54321);
            
            const val1 = rng1.next();
            const val2 = rng2.next();
            
            expect(val1).not.toBe(val2);
        });

        it('should generate numbers between 0 and 1', () => {
            const rng = new SeededRandom(999);
            
            for (let i = 0; i < 100; i++) {
                const val = rng.next();
                expect(val).toBeGreaterThanOrEqual(0);
                expect(val).toBeLessThan(1);
            }
        });

        it('should generate integers in range', () => {
            const rng = new SeededRandom(123);
            
            for (let i = 0; i < 100; i++) {
                const val = rng.nextInt(1, 10);
                expect(val).toBeGreaterThanOrEqual(1);
                expect(val).toBeLessThanOrEqual(10);
                expect(Number.isInteger(val)).toBe(true);
            }
        });

        it('should choose from array', () => {
            const rng = new SeededRandom(456);
            const array = ['a', 'b', 'c'];
            
            const choice = rng.choice(array);
            
            expect(array).toContain(choice);
        });
    });

    describe('generateDungeon', () => {
        it('should generate a dungeon with rooms', () => {
            // Arrange
            const seed = 12345;
            const level = 1;
            
            // Act
            const dungeon = generateDungeon(seed, level);
            
            // Assert
            expect(dungeon.rooms.length).toBeGreaterThan(0);
            expect(dungeon.grid).toBeDefined();
            expect(dungeon.stairsPosition).toBeDefined();
        });

        it('should generate consistent dungeons with same seed', () => {
            const seed = 99999;
            
            const dungeon1 = generateDungeon(seed, 1);
            const dungeon2 = generateDungeon(seed, 1);
            
            expect(dungeon1.rooms.length).toBe(dungeon2.rooms.length);
            expect(dungeon1.stairsPosition).toEqual(dungeon2.stairsPosition);
        });

        it('should generate different dungeons with different seeds', () => {
            const dungeon1 = generateDungeon(111, 1);
            const dungeon2 = generateDungeon(222, 1);
            
            expect(dungeon1.stairsPosition).not.toEqual(dungeon2.stairsPosition);
        });

        it('should have stairs in last room', () => {
            const dungeon = generateDungeon(333, 1);
            const lastRoom = dungeon.rooms[dungeon.rooms.length - 1];
            const stairs = dungeon.stairsPosition;
            
            expect(stairs.x).toBeGreaterThanOrEqual(lastRoom.x);
            expect(stairs.x).toBeLessThan(lastRoom.x + lastRoom.width);
            expect(stairs.y).toBeGreaterThanOrEqual(lastRoom.y);
            expect(stairs.y).toBeLessThan(lastRoom.y + lastRoom.height);
        });

        it('should scale enemy count with level', () => {
            const seed = 444;
            
            const dungeon1 = generateDungeon(seed, 1);
            const dungeon3 = generateDungeon(seed, 3);
            
            expect(dungeon3.enemySpawns.length).toBeGreaterThan(dungeon1.enemySpawns.length);
        });

        it('should place enemies in valid positions', () => {
            const dungeon = generateDungeon(555, 2);
            
            for (const spawn of dungeon.enemySpawns) {
                const tile = dungeon.grid[spawn.position.y][spawn.position.x];
                expect(tile).toBe('floor');
            }
        });

        it('should not place enemies on stairs', () => {
            const dungeon = generateDungeon(666, 5);
            const stairs = dungeon.stairsPosition;
            
            for (const spawn of dungeon.enemySpawns) {
                const samePosition = spawn.position.x === stairs.x && spawn.position.y === stairs.y;
                expect(samePosition).toBe(false);
            }
        });

        it('should create floor tiles in rooms', () => {
            const dungeon = generateDungeon(777, 1);
            let floorCount = 0;
            
            for (const row of dungeon.grid) {
                for (const tile of row) {
                    if (tile === 'floor') {
                        floorCount++;
                    }
                }
            }
            
            expect(floorCount).toBeGreaterThan(0);
        });

        it('should generate item spawns', () => {
            const dungeon = generateDungeon(888, 1);
            
            expect(dungeon.itemSpawns).toBeDefined();
            expect(Array.isArray(dungeon.itemSpawns)).toBe(true);
            expect(dungeon.itemSpawns.length).toBeGreaterThan(0);
        });

        it('should include level in dungeon data', () => {
            const dungeon = generateDungeon(999, 3);
            
            expect(dungeon.level).toBe(3);
        });

        it('should scale item count with level', () => {
            const dungeon1 = generateDungeon(111, 1);
            const dungeon5 = generateDungeon(111, 5);
            
            expect(dungeon5.itemSpawns.length).toBeGreaterThan(dungeon1.itemSpawns.length);
        });

        it('should generate items with proper spawn data', () => {
            const dungeon = generateDungeon(222, 2);
            
            for (const spawn of dungeon.itemSpawns) {
                expect(spawn.itemType).toBeDefined();
                expect(spawn.position).toBeDefined();
                expect(spawn.position.x).toBeGreaterThanOrEqual(0);
                expect(spawn.position.y).toBeGreaterThanOrEqual(0);
                expect(spawn.level).toBe(2);
            }
        });
    });

    describe('getPlayerStartPosition', () => {
        it('should return center of first room', () => {
            // Arrange
            const dungeon = generateDungeon(888, 1);
            
            // Act
            const startPos = getPlayerStartPosition(dungeon);
            
            // Assert
            const firstRoom = dungeon.rooms[0];
            expect(startPos).toEqual(firstRoom.center);
        });

        it('should return fallback position for empty dungeon', () => {
            const dungeon = { rooms: [], grid: [] };
            
            const startPos = getPlayerStartPosition(dungeon);
            
            expect(startPos).toEqual({ x: 1, y: 1 });
        });
    });
});
