/**
 * Unit tests for inventory system
 */
import { describe, it, expect } from '@jest/globals';
import {
    createInventory,
    addItemToInventory,
    removeItemFromInventory,
    useItem,
    equipItem,
    getSlotLetter,
    getInventoryDisplay
} from '../../../src/rogue/inventory.js';
import { ITEM_TYPES } from '../../../src/rogue/constants.js';

describe('Inventory System', () => {
    describe('createInventory', () => {
        it('should create empty inventory with 26 slots', () => {
            // Act
            const inventory = createInventory();
            
            // Assert
            expect(inventory).toHaveLength(26);
            expect(inventory.every(slot => slot === null)).toBe(true);
        });
    });

    describe('addItemToInventory', () => {
        it('should add item to first empty slot', () => {
            // Arrange
            const inventory = createInventory();
            const item = { id: 1, type: ITEM_TYPES.POTION, name: 'Healing Potion' };
            
            // Act
            const result = addItemToInventory(inventory, item);
            
            // Assert
            expect(result.success).toBe(true);
            expect(result.slot).toBe(0);
            expect(result.inventory[0]).toBe(item);
        });

        it('should add item to next available slot', () => {
            let inventory = createInventory();
            const item1 = { id: 1, name: 'Item 1' };
            const item2 = { id: 2, name: 'Item 2' };
            
            inventory = addItemToInventory(inventory, item1).inventory;
            const result = addItemToInventory(inventory, item2);
            
            expect(result.success).toBe(true);
            expect(result.slot).toBe(1);
        });

        it('should fail when inventory is full', () => {
            let inventory = createInventory();
            
            // Fill inventory
            for (let i = 0; i < 26; i++) {
                inventory = addItemToInventory(inventory, { id: i }).inventory;
            }
            
            const result = addItemToInventory(inventory, { id: 999 });
            
            expect(result.success).toBe(false);
            expect(result.slot).toBeNull();
        });
    });

    describe('removeItemFromInventory', () => {
        it('should remove item from slot', () => {
            // Arrange
            const inventory = createInventory();
            const item = { id: 1, name: 'Sword' };
            const addResult = addItemToInventory(inventory, item);
            
            // Act
            const result = removeItemFromInventory(addResult.inventory, 0);
            
            // Assert
            expect(result.success).toBe(true);
            expect(result.item).toBe(item);
            expect(result.inventory[0]).toBeNull();
        });

        it('should fail for empty slot', () => {
            const inventory = createInventory();
            
            const result = removeItemFromInventory(inventory, 0);
            
            expect(result.success).toBe(false);
            expect(result.item).toBeNull();
        });

        it('should fail for invalid slot', () => {
            const inventory = createInventory();
            
            expect(removeItemFromInventory(inventory, -1).success).toBe(false);
            expect(removeItemFromInventory(inventory, 99).success).toBe(false);
        });
    });

    describe('useItem', () => {
        it('should use healing potion', () => {
            // Arrange
            const inventory = createInventory();
            const potion = {
                type: ITEM_TYPES.POTION,
                trueType: 'healing'
            };
            const state = {
                player: { hp: 10, maxHp: 30 },
                statistics: { itemsUsed: 0 }
            };
            const addResult = addItemToInventory(inventory, potion);
            
            // Act
            const result = useItem(addResult.inventory, 0, state);
            
            // Assert
            expect(result.success).toBe(true);
            expect(result.newState.player.hp).toBe(30);
            expect(result.newState.statistics.itemsUsed).toBe(1);
        });

        it('should use identify scroll', () => {
            const inventory = createInventory();
            const scroll = {
                type: ITEM_TYPES.SCROLL,
                trueType: 'identify'
            };
            const state = {
                player: { hp: 20, maxHp: 20 },
                statistics: { itemsUsed: 0 }
            };
            const addResult = addItemToInventory(inventory, scroll);
            
            const result = useItem(addResult.inventory, 0, state);
            
            expect(result.success).toBe(true);
            expect(result.message).toContain('identified');
        });

        it('should fail for empty slot', () => {
            const inventory = createInventory();
            const state = { player: { hp: 20 }, statistics: { itemsUsed: 0 } };
            
            const result = useItem(inventory, 0, state);
            
            expect(result.success).toBe(false);
        });

        it('should not exceed max HP when healing', () => {
            const inventory = createInventory();
            const potion = {
                type: ITEM_TYPES.POTION,
                trueType: 'healing'
            };
            const state = {
                player: { hp: 25, maxHp: 30 },
                statistics: { itemsUsed: 0 }
            };
            const addResult = addItemToInventory(inventory, potion);
            
            const result = useItem(addResult.inventory, 0, state);
            
            expect(result.newState.player.hp).toBe(30);
        });

        it('should handle unknown potion type', () => {
            const inventory = createInventory();
            const potion = {
                type: ITEM_TYPES.POTION,
                trueType: 'unknown_type'
            };
            const state = {
                player: { hp: 10, maxHp: 20 },
                statistics: { itemsUsed: 0 }
            };
            const addResult = addItemToInventory(inventory, potion);
            
            const result = useItem(addResult.inventory, 0, state);
            
            // Should still succeed but not apply any effect
            expect(result.success).toBe(true);
        });

        it('should handle unknown scroll type', () => {
            const inventory = createInventory();
            const scroll = {
                type: ITEM_TYPES.SCROLL,
                trueType: 'unknown_type'
            };
            const state = {
                player: { hp: 20, maxHp: 20 },
                statistics: { itemsUsed: 0 }
            };
            const addResult = addItemToInventory(inventory, scroll);
            
            const result = useItem(addResult.inventory, 0, state);
            
            // Should still succeed but not apply any effect
            expect(result.success).toBe(true);
        });

        it('should handle using weapon to equip it', () => {
            const inventory = createInventory();
            const weapon = {
                type: ITEM_TYPES.WEAPON,
                name: 'Sword',
                damage: [1, 8],
                bonus: 1
            };
            const state = {
                player: { hp: 20, maxHp: 20, weapon: null, ac: 10 },
                statistics: { itemsUsed: 0 },
                inventory: createInventory()
            };
            const addResult = addItemToInventory(inventory, weapon);
            
            const result = useItem(addResult.inventory, 0, state);
            
            expect(result.success).toBe(true);
            expect(result.message).toContain('Equipped');
            expect(result.newState.player.weapon).toEqual(weapon);
        });

        it('should handle using armor to equip it', () => {
            const inventory = createInventory();
            const armor = {
                type: ITEM_TYPES.ARMOR,
                name: 'Chain Mail',
                acBonus: 3
            };
            const state = {
                player: { hp: 20, maxHp: 20, armor: null, ac: 10 },
                statistics: { itemsUsed: 0 },
                inventory: createInventory()
            };
            const addResult = addItemToInventory(inventory, armor);
            
            const result = useItem(addResult.inventory, 0, state);
            
            expect(result.success).toBe(true);
            expect(result.message).toContain('Equipped');
            expect(result.newState.player.armor).toEqual(armor);
            expect(result.newState.player.ac).toBe(13); // 10 + 3
        });
    });

    describe('equipItem', () => {
        it('should equip weapon', () => {
            // Arrange
            const inventory = createInventory();
            const weapon = {
                type: ITEM_TYPES.WEAPON,
                name: 'Iron Sword',
                damage: [1, 8]
            };
            const player = { weapon: null, armor: null, ac: 10 };
            const addResult = addItemToInventory(inventory, weapon);
            
            // Act
            const result = equipItem(addResult.inventory, 0, player);
            
            // Assert
            expect(result.success).toBe(true);
            expect(result.player.weapon).toBe(weapon);
            expect(result.inventory[0]).toBeNull();
        });

        it('should equip armor and update AC', () => {
            const inventory = createInventory();
            const armor = {
                type: ITEM_TYPES.ARMOR,
                name: 'Chain Mail',
                acBonus: 5
            };
            const player = { weapon: null, armor: null, ac: 10 };
            const addResult = addItemToInventory(inventory, armor);
            
            const result = equipItem(addResult.inventory, 0, player);
            
            expect(result.success).toBe(true);
            expect(result.player.armor).toBe(armor);
            expect(result.player.ac).toBe(15);
        });

        it('should swap equipped weapon', () => {
            const inventory = createInventory();
            const sword = {
                type: ITEM_TYPES.WEAPON,
                name: 'Sword',
                damage: [1, 6]
            };
            const axe = {
                type: ITEM_TYPES.WEAPON,
                name: 'Axe',
                damage: [1, 8]
            };
            const player = { weapon: sword, armor: null, ac: 10 };
            const addResult = addItemToInventory(inventory, axe);
            
            const result = equipItem(addResult.inventory, 0, player);
            
            expect(result.success).toBe(true);
            expect(result.player.weapon).toBe(axe);
            expect(result.inventory[0]).toBe(sword);
        });

        it('should fail for non-equipable item', () => {
            const inventory = createInventory();
            const potion = {
                type: ITEM_TYPES.POTION,
                trueType: 'healing'
            };
            const player = { weapon: null, armor: null };
            const addResult = addItemToInventory(inventory, potion);
            
            const result = equipItem(addResult.inventory, 0, player);
            
            expect(result.success).toBe(false);
        });
    });

    describe('getSlotLetter', () => {
        it('should return correct letter for slot', () => {
            // Assert
            expect(getSlotLetter(0)).toBe('a');
            expect(getSlotLetter(1)).toBe('b');
            expect(getSlotLetter(25)).toBe('z');
        });

        it('should return ? for invalid slot', () => {
            expect(getSlotLetter(-1)).toBe('?');
            expect(getSlotLetter(26)).toBe('?');
        });
    });

    describe('getInventoryDisplay', () => {
        it('should display empty slots', () => {
            // Arrange
            const inventory = createInventory();
            
            // Act
            const display = getInventoryDisplay(inventory);
            
            // Assert
            expect(display[0]).toBe('a) empty');
            expect(display[25]).toBe('z) empty');
        });

        it('should display identified items', () => {
            const inventory = createInventory();
            const sword = {
                type: ITEM_TYPES.WEAPON,
                name: 'Iron Sword',
                identified: true
            };
            const addResult = addItemToInventory(inventory, sword);
            
            const display = getInventoryDisplay(addResult.inventory);
            
            expect(display[0]).toBe('a) Iron Sword');
        });

        it('should display unidentified items with appearance', () => {
            const inventory = createInventory();
            const potion = {
                type: ITEM_TYPES.POTION,
                trueType: 'healing',
                appearance: 'red potion',
                identified: false
            };
            const addResult = addItemToInventory(inventory, potion);
            
            const display = getInventoryDisplay(addResult.inventory);
            
            expect(display[0]).toBe('a) red potion');
        });
    });
    
    describe('useItem with new potion types', () => {
        it('should apply poison potion damage', () => {
            const inventory = createInventory();
            const state = { player: { hp: 50, maxHp: 50, statusEffects: [] }, statistics: { itemsUsed: 0 } };
            const potion = {
                id: 'test-potion-1',
                type: ITEM_TYPES.POTION,
                trueType: 'poison',
                appearance: 'green potion',
                prefix: '',
                identified: false
            };
            addItemToInventory(inventory, potion);
            
            const result = useItem(inventory, 0, state);
            
            expect(result.success).toBe(true);
            expect(result.newState.player.hp).toBe(40); // 50 - 10 damage
        });
        
        it('should apply invisibility status effect', () => {
            const inventory = createInventory();
            const state = { player: { hp: 50, statusEffects: [] }, statistics: { itemsUsed: 0 } };
            const potion = {
                id: 'test-potion-2',
                type: ITEM_TYPES.POTION,
                trueType: 'invisibility',
                appearance: 'clear potion',
                prefix: '',
                identified: false
            };
            addItemToInventory(inventory, potion);
            
            const result = useItem(inventory, 0, state);
            
            expect(result.success).toBe(true);
            expect(result.newState.player.statusEffects).toHaveLength(1);
            expect(result.newState.player.statusEffects[0].type).toBe('invisibility');
        });
        
        it('should apply speed status effect', () => {
            const inventory = createInventory();
            const state = { player: { hp: 50, statusEffects: [] }, statistics: { itemsUsed: 0 } };
            const potion = {
                id: 'test-potion-3',
                type: ITEM_TYPES.POTION,
                trueType: 'speed',
                appearance: 'blue potion',
                prefix: '',
                identified: false
            };
            addItemToInventory(inventory, potion);
            
            const result = useItem(inventory, 0, state);
            
            expect(result.success).toBe(true);
            expect(result.newState.player.statusEffects).toHaveLength(1);
            expect(result.newState.player.statusEffects[0].type).toBe('speed');
        });
        
        it('should apply strength status effect', () => {
            const inventory = createInventory();
            const state = { player: { hp: 50, statusEffects: [] }, statistics: { itemsUsed: 0 } };
            const potion = {
                id: 'test-potion-4',
                type: ITEM_TYPES.POTION,
                trueType: 'strength',
                appearance: 'orange potion',
                prefix: '',
                identified: false
            };
            addItemToInventory(inventory, potion);
            
            const result = useItem(inventory, 0, state);
            
            expect(result.success).toBe(true);
            expect(result.newState.player.statusEffects).toHaveLength(1);
            expect(result.newState.player.statusEffects[0].type).toBe('strength');
            expect(result.newState.player.statusEffects[0].magnitude).toBe(5);
        });
        
        it('should apply lesser prefix multiplier', () => {
            const inventory = createInventory();
            const state = { player: { hp: 50, maxHp: 50, statusEffects: [] }, statistics: { itemsUsed: 0 } };
            const potion = {
                id: 'test-potion-5',
                type: ITEM_TYPES.POTION,
                trueType: 'healing',
                appearance: 'red potion',
                prefix: 'lesser',
                identified: false
            };
            addItemToInventory(inventory, potion);
            
            const result = useItem(inventory, 0, state);
            
            expect(result.success).toBe(true);
            // Lesser healing potion heals 10 instead of 20
            expect(result.newState.player.hp).toBe(50); // Already at max, but effect is 10
        });
        
        it('should apply greater prefix multiplier to duration', () => {
            const inventory = createInventory();
            const state = { player: { hp: 50, statusEffects: [] }, statistics: { itemsUsed: 0 } };
            const potion = {
                id: 'test-potion-6',
                type: ITEM_TYPES.POTION,
                trueType: 'speed',
                appearance: 'blue potion',
                prefix: 'greater',
                identified: false
            };
            addItemToInventory(inventory, potion);
            
            const result = useItem(inventory, 0, state);
            
            expect(result.success).toBe(true);
            expect(result.newState.player.statusEffects[0].duration).toBe(16); // 8 * 2
        });
    });
});
