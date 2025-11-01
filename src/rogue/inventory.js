/**
 * Inventory System
 * Manages player inventory with partial identification
 */

import { INVENTORY_SIZE, ITEM_TYPES } from './constants.js';
import { createStatusEffect, addStatusEffect, STATUS_TYPES } from './status-effects.js';

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
    let newInventory = removeResult.inventory; // Track inventory separately for consumables
    let message = '';
    
    // Apply item effect based on type
    switch (item.type) {
        case ITEM_TYPES.POTION: {
            // Apply prefix multiplier
            let multiplier = 1.0;
            if (item.prefix === 'lesser') multiplier = 0.5;
            if (item.prefix === 'greater') multiplier = 2.0;
            
            // Ensure statusEffects array exists
            if (!newState.player.statusEffects) {
                newState.player.statusEffects = [];
            }
            
            switch (item.trueType) {
                case 'healing': {
                    const healAmount = Math.floor(20 * multiplier);
                    newState.player.hp = Math.min(
                        newState.player.hp + healAmount,
                        newState.player.maxHp
                    );
                    message = `Healed ${healAmount} HP!`;
                    break;
                }
                
                case 'poison': {
                    const damage = Math.floor(10 * multiplier); // Half of healing
                    newState.player.hp = Math.max(1, newState.player.hp - damage);
                    message = `Poisoned! Lost ${damage} HP!`;
                    break;
                }
                
                case 'invisibility': {
                    const duration = Math.floor(10 * multiplier);
                    const effect = createStatusEffect(STATUS_TYPES.INVISIBILITY, duration);
                    newState.player.statusEffects = addStatusEffect(newState.player.statusEffects, effect);
                    message = `You become invisible for ${duration} turns!`;
                    break;
                }
                
                case 'speed': {
                    const duration = Math.floor(8 * multiplier);
                    const effect = createStatusEffect(STATUS_TYPES.SPEED, duration);
                    newState.player.statusEffects = addStatusEffect(newState.player.statusEffects, effect);
                    message = `You feel much faster for ${duration} turns!`;
                    break;
                }
                
                case 'strength': {
                    const duration = Math.floor(12 * multiplier);
                    const bonus = Math.floor(5 * multiplier);
                    const effect = createStatusEffect(STATUS_TYPES.STRENGTH, duration, bonus);
                    newState.player.statusEffects = addStatusEffect(newState.player.statusEffects, effect);
                    message = `You feel stronger for ${duration} turns!`;
                    break;
                }
                
                case 'skill': {
                    const duration = Math.floor(12 * multiplier);
                    const bonus = Math.floor(3 * multiplier);
                    const effect = createStatusEffect(STATUS_TYPES.SKILL, duration, bonus);
                    newState.player.statusEffects = addStatusEffect(newState.player.statusEffects, effect);
                    message = `Your skill improves for ${duration} turns!`;
                    break;
                }
                
                case 'sight': {
                    const duration = Math.floor(15 * multiplier);
                    const range = Math.floor(5 * multiplier);
                    const effect = createStatusEffect(STATUS_TYPES.SIGHT, duration, range);
                    newState.player.statusEffects = addStatusEffect(newState.player.statusEffects, effect);
                    message = `Your vision expands for ${duration} turns!`;
                    break;
                }
                
                case 'attraction': {
                    // Instant effect - spawn enemies nearby
                    message = `Monsters are attracted to you!`;
                    // Note: Actual spawning handled in game controller
                    const effect = createStatusEffect(STATUS_TYPES.ATTRACTION, 1); // 1 turn marker
                    newState.player.statusEffects = addStatusEffect(newState.player.statusEffects, effect);
                    break;
                }
                
                case 'stone': {
                    const duration = Math.floor(10 * multiplier);
                    const effect = createStatusEffect(STATUS_TYPES.STONE, duration);
                    newState.player.statusEffects = addStatusEffect(newState.player.statusEffects, effect);
                    message = `You turn to stone for ${duration} turns! Movement slowed, but invulnerable!`;
                    break;
                }
                
                default:
                    message = `Nothing happens...`;
            }
            break;
        }
            
        case ITEM_TYPES.SCROLL:
            if (item.trueType === 'identify') {
                // Identify all items in inventory
                newInventory = newInventory.map(i => 
                    i ? { ...i, identified: true } : null
                );
                message = 'Read scroll. All items identified!';
            }
            break;
            
        case ITEM_TYPES.FOOD:
            const hungerAmount = item.hungerRestore || 100;
            newState.player.hunger = Math.min(
                newState.player.hunger + hungerAmount,
                newState.player.maxHunger
            );
            
            // Food also restores HP (reduced to 1/50 of hunger restoration)
            const hpAmount = Math.floor(hungerAmount / 50);
            newState.player.hp = Math.min(
                newState.player.hp + hpAmount,
                newState.player.maxHp
            );
            message = `Ate ${item.name}. Restored ${hungerAmount} hunger and ${hpAmount} HP!`;
            break;
            
        case ITEM_TYPES.WEAPON:
            // Equip weapon via use
            // For weapons, we need to add back to inventory if replacing
            if (newState.player.weapon) {
                const addResult = addItemToInventory(newInventory, newState.player.weapon);
                if (!addResult.success) {
                    return {
                        success: false,
                        inventory: inventory,
                        newState: state,
                        message: 'Inventory full - cannot swap weapons'
                    };
                }
                newInventory = addResult.inventory;
            }
            
            newState.player.weapon = item;
            message = `Equipped ${item.name}`;
            break;
            
        case ITEM_TYPES.ARMOR:
            // Equip armor via use
            // For armor, we need to add back to inventory if replacing
            if (newState.player.armor) {
                const addResult = addItemToInventory(newInventory, newState.player.armor);
                if (!addResult.success) {
                    return {
                        success: false,
                        inventory: inventory,
                        newState: state,
                        message: 'Inventory full - cannot swap armor'
                    };
                }
                newInventory = addResult.inventory;
            }
            
            newState.player.armor = item;
            newState.player.ac = 10 + item.acBonus;
            message = `Equipped ${item.name}`;
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
    
    // Mark item as identified for consumables
    if (!item.identified && (item.type === ITEM_TYPES.POTION || item.type === ITEM_TYPES.SCROLL)) {
        // Mark item as identified in the inventory
        newInventory = newInventory.map(i => 
            i && i.type === item.type && i.trueType === item.trueType ? { ...i, identified: true } : i
        );
    }
    
    newState.statistics.itemsUsed++;
    newState.inventory = newInventory;
    
    return {
        success: true,
        inventory: newInventory,
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
