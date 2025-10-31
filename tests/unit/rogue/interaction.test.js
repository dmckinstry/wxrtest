/**
 * Unit tests for interaction system
 */
import { describe, it, expect } from '@jest/globals';
import {
    findInteractablesAtPosition,
    getInteractionPrompt,
    getInteractionAction
} from '../../../src/rogue/interaction.js';

describe('Interaction System', () => {
    describe('findInteractablesAtPosition', () => {
        it('should find items at player position', () => {
            const position = { x: 5, y: 5 };
            const entities = {
                items: [
                    { id: '1', position: { x: 5, y: 5 }, name: 'Sword' },
                    { id: '2', position: { x: 6, y: 6 }, name: 'Potion' }
                ],
                enemies: []
            };
            const tile = 'floor';
            
            const result = findInteractablesAtPosition(position, entities, tile);
            
            expect(result.items.length).toBe(1);
            expect(result.items[0].name).toBe('Sword');
            expect(result.stairs).toBe(false);
        });
        
        it('should detect stairs', () => {
            const position = { x: 5, y: 5 };
            const entities = { items: [], enemies: [] };
            const tile = 'stairs_down';
            
            const result = findInteractablesAtPosition(position, entities, tile);
            
            expect(result.stairs).toBe(true);
        });
        
        it('should find adjacent enemies', () => {
            const position = { x: 5, y: 5 };
            const entities = {
                items: [],
                enemies: [
                    { id: '1', position: { x: 6, y: 5 }, name: 'Goblin', hp: 10, isAlive: true },
                    { id: '2', position: { x: 10, y: 10 }, name: 'Dragon', hp: 50, isAlive: true }
                ]
            };
            const tile = 'floor';
            
            const result = findInteractablesAtPosition(position, entities, tile);
            
            expect(result.enemies.length).toBe(1);
            expect(result.enemies[0].name).toBe('Goblin');
        });
        
        it('should not include dead enemies', () => {
            const position = { x: 5, y: 5 };
            const entities = {
                items: [],
                enemies: [
                    { id: '1', position: { x: 6, y: 5 }, name: 'Goblin', hp: 0, isAlive: false }
                ]
            };
            const tile = 'floor';
            
            const result = findInteractablesAtPosition(position, entities, tile);
            
            expect(result.enemies.length).toBe(0);
        });
        
        it('should find enemies on diagonals', () => {
            const position = { x: 5, y: 5 };
            const entities = {
                items: [],
                enemies: [
                    { id: '1', position: { x: 6, y: 6 }, name: 'Goblin', hp: 10, isAlive: true }
                ]
            };
            const tile = 'floor';
            
            const result = findInteractablesAtPosition(position, entities, tile);
            
            expect(result.enemies.length).toBe(1);
        });
    });
    
    describe('getInteractionPrompt', () => {
        it('should generate prompt for items', () => {
            const interactables = {
                items: [{ name: 'Sword' }],
                stairs: false,
                enemies: []
            };
            
            const prompt = getInteractionPrompt(interactables);
            
            expect(prompt).toContain('Pick up Sword');
        });
        
        it('should generate prompt for stairs', () => {
            const interactables = {
                items: [],
                stairs: true,
                enemies: []
            };
            
            const prompt = getInteractionPrompt(interactables);
            
            expect(prompt).toContain('Descend stairs');
        });
        
        it('should generate prompt for enemies', () => {
            const interactables = {
                items: [],
                stairs: false,
                enemies: [{ name: 'Goblin' }]
            };
            
            const prompt = getInteractionPrompt(interactables);
            
            expect(prompt).toContain('Attack Goblin');
        });
        
        it('should combine multiple prompts', () => {
            const interactables = {
                items: [{ name: 'Sword' }],
                stairs: true,
                enemies: [{ name: 'Goblin' }]
            };
            
            const prompt = getInteractionPrompt(interactables);
            
            expect(prompt).toContain('Pick up Sword');
            expect(prompt).toContain('Descend stairs');
            expect(prompt).toContain('Attack Goblin');
        });
    });
    
    describe('getInteractionAction', () => {
        it('should prioritize attacking enemies', () => {
            const interactables = {
                items: [{ name: 'Sword' }],
                stairs: true,
                enemies: [{ name: 'Goblin' }]
            };
            
            const action = getInteractionAction(interactables);
            
            expect(action.type).toBe('attack');
            expect(action.target.name).toBe('Goblin');
        });
        
        it('should pickup items when no enemies', () => {
            const interactables = {
                items: [{ name: 'Sword' }],
                stairs: true,
                enemies: []
            };
            
            const action = getInteractionAction(interactables);
            
            expect(action.type).toBe('pickup');
            expect(action.target.name).toBe('Sword');
        });
        
        it('should descend stairs when nothing else available', () => {
            const interactables = {
                items: [],
                stairs: true,
                enemies: []
            };
            
            const action = getInteractionAction(interactables);
            
            expect(action.type).toBe('descend');
        });
        
        it('should return null when nothing to interact with', () => {
            const interactables = {
                items: [],
                stairs: false,
                enemies: []
            };
            
            const action = getInteractionAction(interactables);
            
            expect(action).toBeNull();
        });
    });
});
