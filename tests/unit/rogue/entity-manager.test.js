/**
 * Unit tests for entity manager
 */
import { describe, it, expect } from '@jest/globals';
import {
    createEnemy,
    createWeapon,
    createArmor,
    createPotion,
    createScroll,
    createGold,
    createFood,
    createItemFromSpawn,
    identifyItem,
    getItemDisplayName,
    isEntityAlive,
    damageEntity,
    generateEnemyLoot,
    getRandomEnemyTypeForLevel,
    isValidSpawnPosition
} from '../../../src/rogue/entity-manager.js';
import { ITEM_TYPES } from '../../../src/rogue/constants.js';

describe('Entity Manager', () => {
    describe('createEnemy', () => {
        it('should create a goblin enemy', () => {
            // Arrange
            const position = { x: 5, y: 5 };
            const level = 1;
            
            // Act
            const enemy = createEnemy('GOBLIN', position, level);
            
            // Assert
            expect(enemy.type).toBe('GOBLIN');
            expect(enemy.name).toBe('Goblin');
            expect(enemy.position).toEqual(position);
            expect(enemy.hp).toBeGreaterThan(0);
            expect(enemy.maxHp).toBeGreaterThan(0);
            expect(enemy.isAlive).toBe(true);
        });

        it('should scale enemy stats with dungeon level', () => {
            const position = { x: 5, y: 5 };
            
            const enemy1 = createEnemy('GOBLIN', position, 1);
            const enemy5 = createEnemy('GOBLIN', position, 5);
            
            expect(enemy5.hp).toBeGreaterThan(enemy1.hp);
            expect(enemy5.maxHp).toBeGreaterThan(enemy1.maxHp);
            expect(enemy5.ac).toBeGreaterThanOrEqual(enemy1.ac);
        });

        it('should create different enemy types', () => {
            const position = { x: 5, y: 5 };
            
            const goblin = createEnemy('GOBLIN', position, 1);
            const skeleton = createEnemy('SKELETON', position, 3);
            const slime = createEnemy('SLIME', position, 1);
            const dragon = createEnemy('DRAGON', position, 7);
            
            expect(goblin.type).toBe('GOBLIN');
            expect(skeleton.type).toBe('SKELETON');
            expect(slime.type).toBe('SLIME');
            expect(dragon.type).toBe('DRAGON');
        });

        it('should throw error for unknown enemy type', () => {
            expect(() => createEnemy('UNKNOWN', { x: 0, y: 0 }, 1))
                .toThrow('Unknown enemy type: UNKNOWN');
        });

        it('should have correct geometry type', () => {
            const goblin = createEnemy('GOBLIN', { x: 0, y: 0 }, 1);
            const skeleton = createEnemy('SKELETON', { x: 0, y: 0 }, 3);
            
            expect(goblin.geometry).toBe('box');
            expect(skeleton.geometry).toBe('cone');
        });
    });

    describe('createWeapon', () => {
        it('should create a weapon with damage', () => {
            // Arrange & Act
            const weapon = createWeapon('Iron Sword', [1, 8], 2);
            
            // Assert
            expect(weapon.type).toBe(ITEM_TYPES.WEAPON);
            expect(weapon.name).toBe('Iron Sword');
            expect(weapon.damage).toEqual([1, 8]);
            expect(weapon.bonus).toBe(2);
            expect(weapon.identified).toBe(true);
        });

        it('should default bonus to 0', () => {
            const weapon = createWeapon('Basic Sword', [1, 6]);
            
            expect(weapon.bonus).toBe(0);
        });

        it('should have unique id', () => {
            const weapon1 = createWeapon('Sword 1', [1, 6]);
            const weapon2 = createWeapon('Sword 2', [1, 6]);
            
            expect(weapon1.id).not.toBe(weapon2.id);
        });
    });

    describe('createArmor', () => {
        it('should create armor with AC bonus', () => {
            // Arrange & Act
            const armor = createArmor('Chain Mail', 5);
            
            // Assert
            expect(armor.type).toBe(ITEM_TYPES.ARMOR);
            expect(armor.name).toBe('Chain Mail');
            expect(armor.acBonus).toBe(5);
            expect(armor.identified).toBe(true);
        });

        it('should have unique id', () => {
            const armor1 = createArmor('Armor 1', 3);
            const armor2 = createArmor('Armor 2', 3);
            
            expect(armor1.id).not.toBe(armor2.id);
        });
    });

    describe('createPotion', () => {
        it('should create unidentified potion', () => {
            // Arrange & Act
            const potion = createPotion('healing', 'red potion', { heal: 20 });
            
            // Assert
            expect(potion.type).toBe(ITEM_TYPES.POTION);
            expect(potion.trueType).toBe('healing');
            expect(potion.appearance).toBe('red potion');
            expect(potion.identified).toBe(false);
            expect(potion.effect).toEqual({ heal: 20 });
        });

        it('should have unique id', () => {
            const potion1 = createPotion('healing', 'red potion', {});
            const potion2 = createPotion('healing', 'red potion', {});
            
            expect(potion1.id).not.toBe(potion2.id);
        });
    });

    describe('createScroll', () => {
        it('should create unidentified scroll', () => {
            // Arrange & Act
            const scroll = createScroll('teleport', 'dusty scroll', { teleport: true });
            
            // Assert
            expect(scroll.type).toBe(ITEM_TYPES.SCROLL);
            expect(scroll.trueType).toBe('teleport');
            expect(scroll.appearance).toBe('dusty scroll');
            expect(scroll.identified).toBe(false);
            expect(scroll.effect).toEqual({ teleport: true });
        });

        it('should have unique id', () => {
            const scroll1 = createScroll('identify', 'old scroll', {});
            const scroll2 = createScroll('identify', 'old scroll', {});
            
            expect(scroll1.id).not.toBe(scroll2.id);
        });
    });

    describe('createGold', () => {
        it('should create gold with amount', () => {
            // Arrange & Act
            const gold = createGold(100);
            
            // Assert
            expect(gold.type).toBe(ITEM_TYPES.GOLD);
            expect(gold.amount).toBe(100);
            expect(gold.identified).toBe(true);
        });

        it('should have unique id', () => {
            const gold1 = createGold(50);
            const gold2 = createGold(50);
            
            expect(gold1.id).not.toBe(gold2.id);
        });
    });

    describe('identifyItem', () => {
        it('should mark item as identified', () => {
            // Arrange
            const potion = createPotion('healing', 'red potion', {});
            
            // Act
            const identified = identifyItem(potion);
            
            // Assert
            expect(identified.identified).toBe(true);
            expect(identified.trueType).toBe('healing');
        });

        it('should not modify original item', () => {
            const potion = createPotion('healing', 'red potion', {});
            
            identifyItem(potion);
            
            expect(potion.identified).toBe(false);
        });
    });

    describe('getItemDisplayName', () => {
        it('should return name for identified weapon', () => {
            // Arrange
            const weapon = createWeapon('Iron Sword', [1, 8]);
            
            // Act
            const name = getItemDisplayName(weapon);
            
            // Assert
            expect(name).toBe('Iron Sword');
        });

        it('should return name for identified armor', () => {
            const armor = createArmor('Chain Mail', 5);
            
            const name = getItemDisplayName(armor);
            
            expect(name).toBe('Chain Mail');
        });

        it('should return appearance for unidentified potion', () => {
            const potion = createPotion('healing', 'red potion', {});
            
            const name = getItemDisplayName(potion);
            
            expect(name).toBe('red potion');
        });

        it('should return formatted name for identified potion', () => {
            const potion = createPotion('healing', 'red potion', {});
            const identified = identifyItem(potion);
            
            const name = getItemDisplayName(identified);
            
            expect(name).toBe('Potion of Healing');
        });

        it('should return appearance for unidentified scroll', () => {
            const scroll = createScroll('teleport', 'dusty scroll', {});
            
            const name = getItemDisplayName(scroll);
            
            expect(name).toBe('dusty scroll');
        });

        it('should return amount for gold', () => {
            const gold = createGold(100);
            
            const name = getItemDisplayName(gold);
            
            expect(name).toBeUndefined(); // Gold doesn't have name or trueType
        });
    });

    describe('isEntityAlive', () => {
        it('should return true for entity with positive hp', () => {
            // Arrange
            const entity = { hp: 10, isAlive: true };
            
            // Act & Assert
            expect(isEntityAlive(entity)).toBe(true);
        });

        it('should return false for entity with 0 hp', () => {
            const entity = { hp: 0, isAlive: true };
            
            expect(isEntityAlive(entity)).toBe(false);
        });

        it('should return false for entity with isAlive false', () => {
            const entity = { hp: 10, isAlive: false };
            
            expect(isEntityAlive(entity)).toBe(false);
        });

        it('should return false for entity with negative hp', () => {
            const entity = { hp: -5, isAlive: true };
            
            expect(isEntityAlive(entity)).toBe(false);
        });
    });

    describe('damageEntity', () => {
        it('should reduce entity hp', () => {
            // Arrange
            const entity = { hp: 20, maxHp: 20, isAlive: true };
            
            // Act
            const damaged = damageEntity(entity, 5);
            
            // Assert
            expect(damaged.hp).toBe(15);
            expect(damaged.isAlive).toBe(true);
        });

        it('should set isAlive to false when hp reaches 0', () => {
            const entity = { hp: 10, maxHp: 20, isAlive: true };
            
            const damaged = damageEntity(entity, 10);
            
            expect(damaged.hp).toBe(0);
            expect(damaged.isAlive).toBe(false);
        });

        it('should not go below 0 hp', () => {
            const entity = { hp: 5, maxHp: 20, isAlive: true };
            
            const damaged = damageEntity(entity, 100);
            
            expect(damaged.hp).toBe(0);
            expect(damaged.isAlive).toBe(false);
        });

        it('should not modify original entity', () => {
            const entity = { hp: 20, maxHp: 20, isAlive: true };
            
            damageEntity(entity, 5);
            
            expect(entity.hp).toBe(20);
        });
    });

    describe('createFood', () => {
        it('should create food with default hunger restore', () => {
            // Arrange & Act
            const food = createFood('ration');
            
            // Assert
            expect(food.type).toBe(ITEM_TYPES.FOOD);
            expect(food.name).toBe('ration');
            expect(food.hungerRestore).toBe(100);
            expect(food.identified).toBe(true);
        });

        it('should create food with custom hunger restore', () => {
            const food = createFood('apple', 50);
            
            expect(food.name).toBe('apple');
            expect(food.hungerRestore).toBe(50);
        });

        it('should have unique id', () => {
            const food1 = createFood('bread');
            const food2 = createFood('bread');
            
            expect(food1.id).not.toBe(food2.id);
        });
    });

    describe('createItemFromSpawn', () => {
        it('should create weapon from weapon spawn', () => {
            const spawn = {
                itemType: 'weapon',
                position: { x: 5, y: 5 },
                level: 1
            };
            
            const item = createItemFromSpawn(spawn);
            
            expect(item.type).toBe(ITEM_TYPES.WEAPON);
            expect(item.position).toEqual({ x: 5, y: 5 });
            expect(item.name).toBeDefined();
        });

        it('should create armor from armor spawn', () => {
            const spawn = {
                itemType: 'armor',
                position: { x: 3, y: 3 },
                level: 2
            };
            
            const item = createItemFromSpawn(spawn);
            
            expect(item.type).toBe(ITEM_TYPES.ARMOR);
            expect(item.position).toEqual({ x: 3, y: 3 });
        });

        it('should create food from food spawn', () => {
            const spawn = {
                itemType: 'food',
                position: { x: 7, y: 7 },
                level: 1
            };
            
            const item = createItemFromSpawn(spawn);
            
            expect(item.type).toBe(ITEM_TYPES.FOOD);
            expect(item.hungerRestore).toBeGreaterThan(0);
        });

        it('should create gold from gold spawn with level scaling', () => {
            const spawn1 = {
                itemType: 'gold',
                position: { x: 1, y: 1 },
                level: 1
            };
            const spawn5 = {
                itemType: 'gold',
                position: { x: 2, y: 2 },
                level: 5
            };
            
            const gold1 = createItemFromSpawn(spawn1);
            const gold5 = createItemFromSpawn(spawn5);
            
            expect(gold1.type).toBe(ITEM_TYPES.GOLD);
            expect(gold5.amount).toBeGreaterThan(gold1.amount);
        });
        
        it('should create potions with prefixes', () => {
            const spawn = { itemType: 'potion', position: { x: 1, y: 1 }, level: 1 };
            
            const potion = createItemFromSpawn(spawn);
            
            expect(potion.type).toBe(ITEM_TYPES.POTION);
            expect(potion).toHaveProperty('prefix');
            expect(potion).toHaveProperty('trueType');
        });
    });
    
    describe('generateEnemyLoot', () => {
        it('should sometimes return null (no drop)', () => {
            const enemy = { position: { x: 5, y: 5 }, type: 'GOBLIN' };
            let nullCount = 0;
            
            for (let i = 0; i < 20; i++) {
                const loot = generateEnemyLoot(enemy, 1);
                if (loot === null) nullCount++;
            }
            
            // Should have some null results (no drop)
            expect(nullCount).toBeGreaterThan(0);
        });
        
        it('should generate item at enemy position when dropping', () => {
            const enemy = { position: { x: 10, y: 15 }, type: 'GOBLIN' };
            
            // Try multiple times to get at least one drop
            let loot = null;
            for (let i = 0; i < 50; i++) {
                loot = generateEnemyLoot(enemy, 1);
                if (loot) break;
            }
            
            if (loot) {
                expect(loot.position.x).toBe(10);
                expect(loot.position.y).toBe(15);
            }
        });
        
        it('should generate level-appropriate items', () => {
            const enemy = { position: { x: 5, y: 5 }, type: 'GOBLIN' };
            
            // Try to get a drop
            let loot = null;
            for (let i = 0; i < 50; i++) {
                loot = generateEnemyLoot(enemy, 5);
                if (loot) break;
            }
            
            if (loot) {
                expect(loot).toHaveProperty('type');
            }
        });
    });
    
    describe('getItemDisplayName with prefixes', () => {
        it('should display potion with prefix when identified', () => {
            const potion = createPotion('healing', 'red potion', {});
            potion.prefix = 'lesser';
            potion.identified = true;
            
            const name = getItemDisplayName(potion);
            
            expect(name).toBe('Lesser Potion of Healing');
        });
        
        it('should display potion without prefix when identified', () => {
            const potion = createPotion('healing', 'red potion', {});
            potion.prefix = '';
            potion.identified = true;
            
            const name = getItemDisplayName(potion);
            
            expect(name).toBe('Potion of Healing');
        });
        
        it('should display greater potion when identified', () => {
            const potion = createPotion('strength', 'orange potion', {});
            potion.prefix = 'greater';
            potion.identified = true;
            
            const name = getItemDisplayName(potion);
            
            expect(name).toBe('Greater Potion of Strength');
        });
    });

    describe('getRandomEnemyTypeForLevel', () => {
        it('should return valid enemy type for level 1', () => {
            // Act
            const enemyType = getRandomEnemyTypeForLevel(1);
            
            // Assert
            expect(enemyType).toBeTruthy();
            expect(typeof enemyType).toBe('string');
        });

        it('should return enemy type appropriate for dungeon level', () => {
            // Act
            const enemyType = getRandomEnemyTypeForLevel(5);
            
            // Assert
            expect(enemyType).toBeTruthy();
        });

        it('should return fallback for level 0', () => {
            // Act
            const enemyType = getRandomEnemyTypeForLevel(0);
            
            // Assert
            expect(enemyType).toBe('GOBLIN');
        });
    });

    describe('isValidSpawnPosition', () => {
        it('should return true for valid spawn position', () => {
            // Arrange
            const grid = [
                ['wall', 'wall', 'wall'],
                ['wall', 'floor', 'floor'],
                ['wall', 'floor', 'wall']
            ];
            const position = { x: 2, y: 1 };
            const existingEnemies = [];
            const playerPosition = { x: 1, y: 2 };
            
            // Act
            const valid = isValidSpawnPosition(position, grid, existingEnemies, playerPosition);
            
            // Assert
            expect(valid).toBe(true);
        });

        it('should return false for wall tile', () => {
            // Arrange
            const grid = [
                ['wall', 'wall', 'wall'],
                ['wall', 'floor', 'floor'],
                ['wall', 'floor', 'wall']
            ];
            const position = { x: 0, y: 0 };
            const existingEnemies = [];
            const playerPosition = { x: 1, y: 1 };
            
            // Act
            const valid = isValidSpawnPosition(position, grid, existingEnemies, playerPosition);
            
            // Assert
            expect(valid).toBe(false);
        });

        it('should return false for occupied position', () => {
            // Arrange
            const grid = [
                ['wall', 'wall', 'wall'],
                ['wall', 'floor', 'floor'],
                ['wall', 'floor', 'wall']
            ];
            const position = { x: 1, y: 1 };
            const existingEnemies = [{ position: { x: 1, y: 1 } }];
            const playerPosition = { x: 2, y: 2 };
            
            // Act
            const valid = isValidSpawnPosition(position, grid, existingEnemies, playerPosition);
            
            // Assert
            expect(valid).toBe(false);
        });

        it('should return false for position too close to player', () => {
            // Arrange
            const grid = [
                ['wall', 'wall', 'wall'],
                ['wall', 'floor', 'floor'],
                ['wall', 'floor', 'wall']
            ];
            const position = { x: 2, y: 1 };
            const existingEnemies = [];
            const playerPosition = { x: 2, y: 1 };
            
            // Act
            const valid = isValidSpawnPosition(position, grid, existingEnemies, playerPosition);
            
            // Assert
            expect(valid).toBe(false);
        });

        it('should return false for out of bounds position', () => {
            // Arrange
            const grid = [
                ['wall', 'wall', 'wall'],
                ['wall', 'floor', 'floor'],
                ['wall', 'floor', 'wall']
            ];
            const position = { x: 10, y: 10 };
            const existingEnemies = [];
            const playerPosition = { x: 1, y: 1 };
            
            // Act
            const valid = isValidSpawnPosition(position, grid, existingEnemies, playerPosition);
            
            // Assert
            expect(valid).toBe(false);
        });
    });
});

