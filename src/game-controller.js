/**
 * Main Game Controller
 * Integrates all rogue-like systems into the WebXR application
 */

import { 
    TILE_SIZE,
    MOVEMENT_THRESHOLD,
    COMBAT_DETECTION_RADIUS,
    ENEMY_TYPES,
    PALETTE
} from './rogue/constants.js';
import { 
    createInitialState,
    updatePlayerWorldPosition,
    updatePlayerPosition,
    damagePlayer,
    addExperience,
    incrementKills,
    setCombatMode,
    updateAccumulatedMovement,
    addGold
} from './rogue/game-state.js';
import { advanceTurn, checkTurnAdvancement } from './rogue/turn-manager.js';
import { 
    worldToGrid,
    gridToWorld,
    isWalkable,
    findPath
} from './rogue/grid-utils.js';
import { generateDungeon, getPlayerStartPosition } from './rogue/dungeon-generator.js';
import { 
    computeVisibleTiles,
    updateExploredTiles,
    filterVisibleEntities
} from './rogue/visibility.js';
import {
    createWall,
    createFloor,
    createStairsDown,
    createRoomLight,
    createMovementIndicator,
    createEnemy,
    createPlayer,
    createHUDCanvas
} from './rogue/render-utils.js';
import {
    readJoystickAxes,
    calculateMovementDelta,
    calculateMovementDistance,
    detectCombatMode,
    calculateMovementBudget,
    checkCollision
} from './rogue/movement.js';
import { createEnemy as createEnemyEntity, damageEntity, isEntityAlive } from './rogue/entity-manager.js';
import { executeAttack, processEnemyTurn, getCombatMessage } from './rogue/combat.js';
import { 
    playFootstepSound,
    playCombatHitSound,
    playEnemyDeathSound,
    playLevelUpSound,
    createAmbientDrone
} from './rogue/audio-generator.js';

/**
 * Create and initialize the game
 * @param {object} THREE - Three.js library
 * @param {object} scene - Three.js scene
 * @param {object} camera - Three.js camera
 * @param {object} renderer - Three.js renderer with XR enabled
 * @returns {object} Game controller
 */
export function createGame(THREE, scene, camera, renderer) {
    // Initialize game state
    const seed = Date.now();
    let gameState = createInitialState(seed);
    
    // Generate initial dungeon
    const dungeon = generateDungeon(seed, 1);
    gameState.dungeon = dungeon;
    
    // Set player starting position
    const startPos = getPlayerStartPosition(dungeon);
    gameState.player.position = startPos;
    const startWorld = gridToWorld(startPos.x, startPos.y);
    gameState.player.worldPosition = { 
        x: startWorld.x, 
        y: 1.6, 
        z: startWorld.z 
    };
    
    // Initialize visibility
    gameState.visibleTiles = computeVisibleTiles(dungeon.grid, startPos);
    gameState.exploredTiles = updateExploredTiles(new Set(), gameState.visibleTiles);
    
    // Create entities from spawn data
    gameState.entities.enemies = dungeon.enemySpawns.map(spawn =>
        createEnemyEntity(spawn.type, spawn.position, spawn.level)
    );
    
    // Create scene objects
    const dungeonMeshes = [];
    const enemyMeshes = new Map();
    const lightMap = new Map();
    
    // Build dungeon geometry
    for (let y = 0; y < dungeon.height; y++) {
        for (let x = 0; x < dungeon.width; x++) {
            const tile = dungeon.grid[y][x];
            const world = gridToWorld(x, y);
            
            if (tile === 'wall') {
                const wall = createWall(THREE, world.x, world.z);
                scene.add(wall);
                dungeonMeshes.push(wall);
            } else if (tile === 'floor' || tile === 'door') {
                const floor = createFloor(THREE, world.x, world.z, 'hidden');
                scene.add(floor);
                dungeonMeshes.push(floor);
            } else if (tile === 'stairs_down') {
                const floor = createFloor(THREE, world.x, world.z, 'hidden');
                scene.add(floor);
                dungeonMeshes.push(floor);
                
                const stairs = createStairsDown(THREE, world.x, world.z);
                scene.add(stairs);
                dungeonMeshes.push(stairs);
            }
        }
    }
    
    // Add room lights
    for (const room of dungeon.rooms) {
        const center = gridToWorld(room.center.x, room.center.y);
        const light = createRoomLight(THREE, center.x, center.z, false);
        scene.add(light);
        lightMap.set(`${room.center.x},${room.center.y}`, light);
    }
    
    // Create player mesh
    const playerMesh = createPlayer(THREE);
    playerMesh.position.set(
        gameState.player.worldPosition.x,
        0,
        gameState.player.worldPosition.z
    );
    scene.add(playerMesh);
    
    // Create enemy meshes
    for (const enemy of gameState.entities.enemies) {
        const config = ENEMY_TYPES[enemy.type];
        const world = gridToWorld(enemy.position.x, enemy.position.y);
        const mesh = createEnemy(THREE, config, world.x, world.z);
        mesh.visible = false; // Hidden until in visible range
        scene.add(mesh);
        enemyMeshes.set(enemy.id, mesh);
    }
    
    // Create HUD
    const hudCanvas = createHUDCanvas({
        hp: gameState.player.hp,
        maxHp: gameState.player.maxHp,
        hunger: gameState.player.hunger,
        maxHunger: gameState.player.maxHunger,
        level: gameState.player.level,
        turn: gameState.turnCount
    });
    const hudTexture = new THREE.CanvasTexture(hudCanvas);
    const hudGeometry = new THREE.PlaneGeometry(2, 1);
    const hudMaterial = new THREE.MeshBasicMaterial({ 
        map: hudTexture,
        transparent: true
    });
    const hudMesh = new THREE.Mesh(hudGeometry, hudMaterial);
    hudMesh.position.set(-1.5, 1.2, -2);
    camera.add(hudMesh);
    
    // Create movement indicator
    let movementIndicator = null;
    
    // Start ambient drone
    const ambientDrone = createAmbientDrone(0.05);
    
    // Last update time for delta calculation
    let lastTime = Date.now();
    
    // Combat log
    const combatLog = [];
    
    /**
     * Update game state and render
     */
    function update() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        
        if (gameState.gameOver) {
            return; // Stop updating if game over
        }
        
        // Read controller input
        const controller = renderer.xr.getController(0);
        const axes = readJoystickAxes(controller);
        const moveDelta = calculateMovementDelta(axes, deltaTime, 2.0);
        const moveDistance = calculateMovementDistance(moveDelta);
        
        // Apply movement if not in combat mode or always allow in exploration
        if (moveDistance > 0.01) {
            const newWorldPos = {
                x: gameState.player.worldPosition.x + moveDelta.dx,
                y: gameState.player.worldPosition.y,
                z: gameState.player.worldPosition.z + moveDelta.dz
            };
            
            // Check collision
            if (checkCollision(newWorldPos, dungeon.grid, worldToGrid, isWalkable)) {
                gameState = updatePlayerWorldPosition(gameState, newWorldPos);
                
                // Update player mesh
                playerMesh.position.set(newWorldPos.x, 0, newWorldPos.z);
                camera.position.set(newWorldPos.x, 1.6, newWorldPos.z);
                
                // Update grid position
                const gridPos = worldToGrid(newWorldPos.x, newWorldPos.z);
                if (gridPos.x !== gameState.player.position.x || 
                    gridPos.y !== gameState.player.position.y) {
                    gameState = updatePlayerPosition(gameState, gridPos);
                    
                    // Update visibility
                    gameState.visibleTiles = computeVisibleTiles(dungeon.grid, gridPos);
                    gameState.exploredTiles = updateExploredTiles(
                        gameState.exploredTiles,
                        gameState.visibleTiles
                    );
                }
                
                // Accumulate movement
                gameState = updateAccumulatedMovement(gameState, moveDistance);
                
                // Check for turn advancement
                if (checkTurnAdvancement(gameState)) {
                    gameState = advanceTurn(gameState);
                    playFootstepSound(0.2);
                    
                    // Process enemy turns
                    processEnemies();
                    
                    // Update HUD
                    updateHUD();
                }
                
                // Check combat mode
                const visibleEnemies = filterVisibleEntities(
                    gameState.entities.enemies.filter(isEntityAlive),
                    gameState.visibleTiles
                );
                const inCombat = detectCombatMode(
                    newWorldPos,
                    visibleEnemies,
                    COMBAT_DETECTION_RADIUS
                );
                gameState = setCombatMode(gameState, inCombat);
            }
        }
        
        // Update floor visibility
        updateDungeonVisibility();
        
        // Update enemy visibility
        updateEnemyVisibility();
        
        // Update room lights
        updateLights();
        
        // Show movement indicator in combat mode
        updateMovementIndicator();
    }
    
    /**
     * Update dungeon tile visibility
     */
    function updateDungeonVisibility() {
        let meshIndex = 0;
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const key = `${x},${y}`;
                const tile = dungeon.grid[y][x];
                
                if (tile === 'wall') {
                    meshIndex++;
                    continue;
                }
                
                const visible = gameState.visibleTiles.has(key);
                const explored = gameState.exploredTiles.has(key);
                
                if (dungeonMeshes[meshIndex]) {
                    dungeonMeshes[meshIndex].visible = visible || explored;
                    
                    if (tile === 'floor' || tile === 'door') {
                        const visState = visible ? 'visible' : explored ? 'explored' : 'hidden';
                        const color = visState === 'visible' ? PALETTE.FLOOR : 
                                     visState === 'explored' ? PALETTE.EXPLORED : PALETTE.HIDDEN;
                        dungeonMeshes[meshIndex].material.color.setHex(color);
                    }
                }
                
                meshIndex++;
                if (tile === 'stairs_down') {
                    meshIndex++; // Skip stairs mesh
                }
            }
        }
    }
    
    /**
     * Update enemy mesh visibility
     */
    function updateEnemyVisibility() {
        for (const enemy of gameState.entities.enemies) {
            const mesh = enemyMeshes.get(enemy.id);
            if (mesh) {
                const key = `${enemy.position.x},${enemy.position.y}`;
                mesh.visible = gameState.visibleTiles.has(key) && isEntityAlive(enemy);
            }
        }
    }
    
    /**
     * Update room lights based on visibility
     */
    function updateLights() {
        for (const [key, light] of lightMap.entries()) {
            const visible = gameState.visibleTiles.has(key);
            light.intensity = visible ? 1.0 : 0.0;
        }
    }
    
    /**
     * Update movement budget indicator
     */
    function updateMovementIndicator() {
        if (gameState.inCombatMode) {
            const budget = calculateMovementBudget(gameState.accumulatedMovement);
            const radius = budget * MOVEMENT_THRESHOLD;
            
            if (!movementIndicator) {
                movementIndicator = createMovementIndicator(THREE, radius, MOVEMENT_THRESHOLD);
                scene.add(movementIndicator);
            }
            
            movementIndicator.position.set(
                gameState.player.worldPosition.x,
                0.01,
                gameState.player.worldPosition.z
            );
            movementIndicator.visible = true;
        } else if (movementIndicator) {
            movementIndicator.visible = false;
        }
    }
    
    /**
     * Process all enemy turns
     */
    function processEnemies() {
        for (const enemy of gameState.entities.enemies) {
            if (!isEntityAlive(enemy)) continue;
            
            const action = processEnemyTurn(
                enemy,
                gameState.player.position,
                dungeon.grid,
                findPath
            );
            
            if (action.action === 'attack') {
                // Enemy attacks player
                const result = executeAttack(enemy, gameState.player);
                const message = getCombatMessage(enemy.name, 'Player', result);
                combatLog.push(message);
                
                if (result.hit) {
                    playCombatHitSound(0.3);
                    gameState = damagePlayer(gameState, result.damage);
                }
            } else if (action.action === 'move') {
                // Move enemy
                enemy.position = action.newPosition;
                const world = gridToWorld(action.newPosition.x, action.newPosition.y);
                const mesh = enemyMeshes.get(enemy.id);
                if (mesh) {
                    mesh.position.set(world.x, 1, world.z);
                }
            }
        }
    }
    
    /**
     * Update HUD display
     */
    function updateHUD() {
        const newCanvas = createHUDCanvas({
            hp: gameState.player.hp,
            maxHp: gameState.player.maxHp,
            hunger: gameState.player.hunger,
            maxHunger: gameState.player.maxHunger,
            level: gameState.player.level,
            turn: gameState.turnCount
        });
        hudTexture.image = newCanvas;
        hudTexture.needsUpdate = true;
    }
    
    /**
     * Clean up resources
     */
    function dispose() {
        if (ambientDrone) {
            ambientDrone.stop();
        }
        
        // Remove all meshes
        dungeonMeshes.forEach(mesh => scene.remove(mesh));
        enemyMeshes.forEach(mesh => scene.remove(mesh));
        scene.remove(playerMesh);
        scene.remove(hudMesh);
        if (movementIndicator) {
            scene.remove(movementIndicator);
        }
    }
    
    return {
        update,
        dispose,
        getState: () => gameState,
        getCombatLog: () => combatLog
    };
}
