/**
 * Inventory System
 * Manages player inventory with partial identification
 */

import { INVENTORY_SIZE, ITEM_TYPES } from './constants.js';

/**
 * Create empty inventory
 * @returns {Array} Empty inventory array
 */
export function createInventory() {
    return Array(INVENTORY_SIZE).fill(null);
}

/**
 * Add item to inventory
 * @param {Array} inventory - Current inventory
 * @param {object} item - Item to add
 * @returns {{success: boolean, inventory: Array, slot: number|null}} Result
 */
export function addItemToInventory(inventory, item) {
    // Find first empty slot
    for (let i = 0; i < inventory.length; i++) {
        if (inventory[i] === null) {
            const newInventory = [...inventory];
            newInventory[i] = item;
            return {
                success: true,
                inventory: newInventory,
                slot: i
            };
        }
    }
    
    return {
        success: false,
        inventory: inventory,
        slot: null
    };
}

/**
 * Remove item from inventory slot
 * @param {Array} inventory - Current inventory
 * @param {number} slot - Slot index
 * @returns {{success: boolean, inventory: Array, item: object|null}} Result
 */
export function removeItemFromInventory(inventory, slot) {
    if (slot < 0 || slot >= inventory.length || inventory[slot] === null) {
        return {
            success: false,
            inventory: inventory,
            item: null
        };
    }
    
    const newInventory = [...inventory];
    const item = newInventory[slot];
    newInventory[slot] = null;
    
    return {
        success: true,
        inventory: newInventory,
        item: item
    };
}

/**
 * Use an item from inventory
 * @param {Array} inventory - Current inventory
 * @param {number} slot - Slot index
 * @param {object} state - Current game state
 * @returns {{success: boolean, inventory: Array, newState: object, message: string}} Result
 */
export function useItem(inventory, slot, state) {
    const removeResult = removeItemFromInventory(inventory, slot);
    
    if (!removeResult.success) {
        return {
            success: false,
            inventory: inventory,
            newState: state,
            message: 'No item in that slot'
        };
    }
    
    const item = removeResult.item;
    let newState = { ...state };
    let message = '';
    
    // Apply item effect based on type
    switch (item.type) {
        case ITEM_TYPES.POTION:
            if (item.trueType === 'healing') {
                const healAmount = 20;
                newState.player.hp = Math.min(
                    newState.player.hp + healAmount,
                    newState.player.maxHp
                );
                message = `Healed ${healAmount} HP!`;
            }
            break;
            
        case ITEM_TYPES.SCROLL:
            if (item.trueType === 'identify') {
                // Identify all items in inventory
                newState.inventory = inventory.map(i => 
                    i ? { ...i, identified: true } : null
                );
                message = 'All items identified!';
            }
            break;
            
        default:
            message = 'Cannot use this item';
            return {
                success: false,
                inventory: inventory,
                newState: state,
                message: message
            };
    }
    
    // Mark item as identified
    if (!item.identified) {
        newState.inventory = newState.inventory || inventory;
    }
    
    newState.statistics.itemsUsed++;
    
    return {
        success: true,
        inventory: removeResult.inventory,
        newState: newState,
        message: message
    };
}

/**
 * Equip weapon or armor
 * @param {Array} inventory - Current inventory
 * @param {number} slot - Slot index
 * @param {object} player - Player state
 * @returns {{success: boolean, inventory: Array, player: object, message: string}} Result
 */
export function equipItem(inventory, slot, player) {
    if (slot < 0 || slot >= inventory.length || inventory[slot] === null) {
        return {
            success: false,
            inventory: inventory,
            player: player,
            message: 'No item in that slot'
        };
    }
    
    const item = inventory[slot];
    let newInventory = [...inventory];
    let newPlayer = { ...player };
    let message = '';
    
    if (item.type === ITEM_TYPES.WEAPON) {
        // Remove item from slot first
        newInventory[slot] = null;
        
        // Unequip current weapon if any
        if (newPlayer.weapon) {
            const addResult = addItemToInventory(newInventory, newPlayer.weapon);
            if (!addResult.success) {
                return {
                    success: false,
                    inventory: inventory,
                    player: player,
                    message: 'Inventory full'
                };
            }
            newInventory = addResult.inventory;
        }
        
        newPlayer.weapon = item;
        message = `Equipped ${item.name}`;
    } else if (item.type === ITEM_TYPES.ARMOR) {
        // Remove item from slot first
        newInventory[slot] = null;
        
        // Unequip current armor if any
        if (newPlayer.armor) {
            const addResult = addItemToInventory(newInventory, newPlayer.armor);
            if (!addResult.success) {
                return {
                    success: false,
                    inventory: inventory,
                    player: player,
                    message: 'Inventory full'
                };
            }
            newInventory = addResult.inventory;
        }
        
        newPlayer.armor = item;
        newPlayer.ac = 10 + item.acBonus;
        message = `Equipped ${item.name}`;
    } else {
        return {
            success: false,
            inventory: inventory,
            player: player,
            message: 'Cannot equip this item'
        };
    }
    
    return {
        success: true,
        inventory: newInventory,
        player: newPlayer,
        message: message
    };
}

/**
 * Get slot letter (a-z)
 * @param {number} slot - Slot index (0-25)
 * @returns {string} Letter
 */
export function getSlotLetter(slot) {
    if (slot < 0 || slot >= INVENTORY_SIZE) {
        return '?';
    }
    return String.fromCharCode(97 + slot); // 97 = 'a'
}

/**
 * Get inventory list for display
 * @param {Array} inventory - Current inventory
 * @returns {Array<string>} Display strings
 */
export function getInventoryDisplay(inventory) {
    return inventory.map((item, index) => {
        const letter = getSlotLetter(index);
        if (item === null) {
            return `${letter}) empty`;
        }
        
        const displayName = item.identified || 
                           item.type === ITEM_TYPES.WEAPON || 
                           item.type === ITEM_TYPES.ARMOR
            ? item.name || item.trueType
            : item.appearance;
            
        return `${letter}) ${displayName}`;
    });
}
