/**
 * Turn Manager
 * Manages turn-based mechanics including action queue and turn advancement
 */

import { MOVEMENT_THRESHOLD, HUNGER_RATE } from './constants.js';
import { decreaseHunger, incrementTurn, resetAccumulatedMovement } from './game-state.js';
import { hasStatusEffect, STATUS_TYPES } from './status-effects.js';

/**
 * Create action queue
 * @returns {Array} Empty action queue
 */
export function createActionQueue() {
    return [];
}

/**
 * Add action to queue
 * @param {Array} queue - Action queue
 * @param {object} action - Action object {type, data}
 * @returns {Array} New queue
 */
export function addAction(queue, action) {
    return [...queue, action];
}

/**
 * Process next action from queue
 * @param {Array} queue - Action queue
 * @returns {{action: object|null, newQueue: Array}} Processed action and remaining queue
 */
export function processNextAction(queue) {
    if (queue.length === 0) {
        return { action: null, newQueue: queue };
    }
    
    const [action, ...newQueue] = queue;
    return { action, newQueue };
}

/**
 * Calculate effective movement threshold based on status effects
 * @param {Array} statusEffects - Active status effects (can be null/undefined)
 * @param {number} baseThreshold - Base movement threshold
 * @returns {number} Effective movement threshold
 */
export function getEffectiveMovementThreshold(statusEffects, baseThreshold = MOVEMENT_THRESHOLD) {
    const effects = statusEffects || [];
    // Speed effect doubles the movement threshold (player can move twice as much per turn)
    if (hasStatusEffect(effects, STATUS_TYPES.SPEED)) {
        return baseThreshold * 2;
    }
    return baseThreshold;
}

/**
 * Check if movement threshold crossed for turn advancement
 * @param {number} accumulatedMovement - Current accumulated movement
 * @param {number} threshold - Movement threshold (default from constants)
 * @returns {boolean} True if threshold crossed
 */
export function shouldAdvanceTurn(accumulatedMovement, threshold = MOVEMENT_THRESHOLD) {
    return accumulatedMovement >= threshold;
}

/**
 * Advance turn (decrement hunger, increment turn counter, reset movement)
 * @param {object} state - Current game state
 * @returns {object} New state
 */
export function advanceTurn(state) {
    let newState = state;
    
    // Increment turn counter
    newState = incrementTurn(newState);
    
    // Decrease hunger
    newState = decreaseHunger(newState, HUNGER_RATE);
    
    // Reset accumulated movement
    newState = resetAccumulatedMovement(newState);
    
    return newState;
}

/**
 * Execute player action and process turn
 * @param {object} state - Current game state
 * @param {object} action - Action to execute {type, data}
 * @returns {object} New state after action and turn processing
 */
export function executePlayerAction(state, action) {
    // This will be expanded to handle different action types
    // For now, just advance the turn
    return advanceTurn(state);
}

/**
 * Process enemy turns
 * @param {object} state - Current game state
 * @returns {object} New state after all enemy turns
 */
export function processEnemyTurns(state) {
    // This will be implemented with enemy AI
    // For now, return state unchanged
    return state;
}

/**
 * Check if turn should be processed based on accumulated movement
 * @param {object} state - Current game state
 * @returns {boolean} True if turn should be processed
 */
export function checkTurnAdvancement(state) {
    const effectiveThreshold = getEffectiveMovementThreshold(state.player.statusEffects);
    return shouldAdvanceTurn(state.accumulatedMovement, effectiveThreshold);
}
