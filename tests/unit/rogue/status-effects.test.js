/**
 * Status Effects System Tests
 */

import {
    STATUS_TYPES,
    createStatusEffect,
    addStatusEffect,
    updateStatusEffects,
    hasStatusEffect,
    getStatusEffect,
    getEffectDisplayStrings
} from '../../../src/rogue/status-effects.js';

describe('Status Effects System', () => {
    describe('createStatusEffect', () => {
        it('should create a status effect with default magnitude', () => {
            const effect = createStatusEffect(STATUS_TYPES.INVISIBILITY, 10);
            
            expect(effect.type).toBe(STATUS_TYPES.INVISIBILITY);
            expect(effect.duration).toBe(10);
            expect(effect.magnitude).toBe(1);
            expect(effect.turnsRemaining).toBe(10);
        });
        
        it('should create a status effect with custom magnitude', () => {
            const effect = createStatusEffect(STATUS_TYPES.STRENGTH, 12, 5);
            
            expect(effect.type).toBe(STATUS_TYPES.STRENGTH);
            expect(effect.duration).toBe(12);
            expect(effect.magnitude).toBe(5);
            expect(effect.turnsRemaining).toBe(12);
        });
    });
    
    describe('addStatusEffect', () => {
        it('should add new effect to empty list', () => {
            const effects = [];
            const newEffect = createStatusEffect(STATUS_TYPES.SPEED, 8);
            
            const result = addStatusEffect(effects, newEffect);
            
            expect(result).toHaveLength(1);
            expect(result[0].type).toBe(STATUS_TYPES.SPEED);
        });
        
        it('should add different effect to existing list', () => {
            const effects = [createStatusEffect(STATUS_TYPES.SPEED, 8)];
            const newEffect = createStatusEffect(STATUS_TYPES.STRENGTH, 12);
            
            const result = addStatusEffect(effects, newEffect);
            
            expect(result).toHaveLength(2);
            expect(result[1].type).toBe(STATUS_TYPES.STRENGTH);
        });
        
        it('should replace effect with longer duration', () => {
            const effects = [createStatusEffect(STATUS_TYPES.SPEED, 5)];
            const newEffect = createStatusEffect(STATUS_TYPES.SPEED, 10);
            
            const result = addStatusEffect(effects, newEffect);
            
            expect(result).toHaveLength(1);
            expect(result[0].turnsRemaining).toBe(10);
        });
        
        it('should not replace effect with shorter duration', () => {
            const effects = [createStatusEffect(STATUS_TYPES.SPEED, 10)];
            const newEffect = createStatusEffect(STATUS_TYPES.SPEED, 5);
            
            const result = addStatusEffect(effects, newEffect);
            
            expect(result).toHaveLength(1);
            expect(result[0].turnsRemaining).toBe(10);
        });
    });
    
    describe('updateStatusEffects', () => {
        it('should decrease turns remaining by 1', () => {
            const effects = [
                createStatusEffect(STATUS_TYPES.SPEED, 8),
                createStatusEffect(STATUS_TYPES.STRENGTH, 12)
            ];
            
            const result = updateStatusEffects(effects);
            
            expect(result[0].turnsRemaining).toBe(7);
            expect(result[1].turnsRemaining).toBe(11);
        });
        
        it('should remove effects with 0 turns remaining', () => {
            const effect = createStatusEffect(STATUS_TYPES.SPEED, 8);
            effect.turnsRemaining = 1;
            const effects = [effect];
            
            const result = updateStatusEffects(effects);
            
            expect(result).toHaveLength(0);
        });
        
        it('should keep effects with turns remaining', () => {
            const effects = [
                createStatusEffect(STATUS_TYPES.SPEED, 8),
                { ...createStatusEffect(STATUS_TYPES.STRENGTH, 12), turnsRemaining: 1 }
            ];
            
            const result = updateStatusEffects(effects);
            
            expect(result).toHaveLength(1);
            expect(result[0].type).toBe(STATUS_TYPES.SPEED);
        });
    });
    
    describe('hasStatusEffect', () => {
        it('should return true if effect exists', () => {
            const effects = [
                createStatusEffect(STATUS_TYPES.SPEED, 8),
                createStatusEffect(STATUS_TYPES.STRENGTH, 12)
            ];
            
            expect(hasStatusEffect(effects, STATUS_TYPES.SPEED)).toBe(true);
            expect(hasStatusEffect(effects, STATUS_TYPES.STRENGTH)).toBe(true);
        });
        
        it('should return false if effect does not exist', () => {
            const effects = [
                createStatusEffect(STATUS_TYPES.SPEED, 8)
            ];
            
            expect(hasStatusEffect(effects, STATUS_TYPES.INVISIBILITY)).toBe(false);
        });
        
        it('should return false for empty list', () => {
            expect(hasStatusEffect([], STATUS_TYPES.SPEED)).toBe(false);
        });
    });
    
    describe('getStatusEffect', () => {
        it('should return effect if it exists', () => {
            const speedEffect = createStatusEffect(STATUS_TYPES.SPEED, 8);
            const effects = [speedEffect];
            
            const result = getStatusEffect(effects, STATUS_TYPES.SPEED);
            
            expect(result).toBe(speedEffect);
        });
        
        it('should return null if effect does not exist', () => {
            const effects = [createStatusEffect(STATUS_TYPES.SPEED, 8)];
            
            const result = getStatusEffect(effects, STATUS_TYPES.INVISIBILITY);
            
            expect(result).toBeNull();
        });
    });
    
    describe('getEffectDisplayStrings', () => {
        it('should format effect display strings', () => {
            const effects = [
                createStatusEffect(STATUS_TYPES.SPEED, 8),
                createStatusEffect(STATUS_TYPES.STRENGTH, 12)
            ];
            
            const result = getEffectDisplayStrings(effects);
            
            expect(result).toHaveLength(2);
            expect(result[0]).toBe('Speed (8)');
            expect(result[1]).toBe('Strength (12)');
        });
        
        it('should return empty array for no effects', () => {
            const result = getEffectDisplayStrings([]);
            
            expect(result).toEqual([]);
        });
        
        it('should capitalize effect names', () => {
            const effects = [createStatusEffect(STATUS_TYPES.INVISIBILITY, 10)];
            
            const result = getEffectDisplayStrings(effects);
            
            expect(result[0]).toBe('Invisibility (10)');
        });
    });
});
