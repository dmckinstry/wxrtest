/**
 * Main Game Controller
 * Integrates all rogue-like systems into the WebXR application
 */

import { 
    MOVEMENT_THRESHOLD,
    COMBAT_DETECTION_RADIUS,
    ENEMY_TYPES,
    PALETTE,
    ITEM_TYPES
} from './rogue/constants.js';
import { 
    createInitialState,
    updatePlayerWorldPosition,
    updatePlayerPosition,
    updatePlayerRotation,
    damagePlayer,
    setCombatMode,
    updateAccumulatedMovement,
    addItemToInventory,
    removeItemFromWorld,
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
    createItem,
    createHUDCanvas
} from './rogue/render-utils.js';
import {
    readJoystickAxes,
    readKeyboardAxes,
    calculateMovementDelta,
    calculateMovementDistance,
    calculateRotationDelta,
    detectCombatMode,
    calculateMovementBudget,
    checkCollision,
    calculateCameraRotation,
    clampPitch
} from './rogue/movement.js';
import { createEnemy as createEnemyEntity, isEntityAlive, createItemFromSpawn } from './rogue/entity-manager.js';
import { executeAttack, processEnemyTurn, getCombatMessage } from './rogue/combat.js';
import { 
    playFootstepSound,
    playCombatHitSound,
    createAmbientDrone
} from './rogue/audio-generator.js';
import {
    findInteractablesAtPosition,
    getInteractionAction
} from './rogue/interaction.js';
import { getInventoryDisplay, getSlotLetter } from './rogue/inventory.js';

/**
 * Create and initialize the game
 * @param {object} THREE - Three.js library
 * @param {object} scene - Three.js scene
 * @param {object} camera - Three.js camera
 * @param {object} renderer - Three.js renderer with XR enabled
 * @param {number} customSeed - Optional custom seed for reproducible dungeons
 * @param {object} keyboardState - Optional keyboard state tracker for desktop mode
 * @returns {object} Game controller
 */
export function createGame(THREE, scene, camera, renderer, customSeed = null, keyboardState = null) {
    // Initialize game state
    const seed = customSeed !== null ? customSeed : Date.now();
    let gameState = createInitialState(seed);
    
    // Create scene objects
    let dungeonMeshes = new Map(); // Use Map with position keys instead of array
    let enemyMeshes = new Map();
    let itemMeshes = new Map();
    let lightMap = new Map();
    let playerMesh = null; // Will be initialized after dungeon load
    
    // Generate initial dungeon
    let dungeon = generateDungeon(seed, 1);
    gameState.dungeon = dungeon;
    
    /**
     * Clear and rebuild dungeon for new level
     * @param {number} newLevel - The new dungeon level
     */
    function loadNewDungeonLevel(newLevel) {
        // Clear existing dungeon meshes
        dungeonMeshes.forEach(mesh => scene.remove(mesh));
        dungeonMeshes.clear();
        
        // Clear existing enemy meshes
        enemyMeshes.forEach(mesh => scene.remove(mesh));
        enemyMeshes.clear();
        
        // Clear existing item meshes
        itemMeshes.forEach(mesh => scene.remove(mesh));
        itemMeshes.clear();
        
        // Clear existing lights
        lightMap.forEach(light => scene.remove(light));
        lightMap.clear();
        
        // Generate new dungeon
        dungeon = generateDungeon(seed, newLevel);
        gameState.dungeon = dungeon;
        gameState.dungeon.level = newLevel;
        
        // Update statistics
        gameState.statistics.deepestLevel = Math.max(gameState.statistics.deepestLevel, newLevel);
        
        // Set player starting position
        const startPos = getPlayerStartPosition(dungeon);
        gameState.player.position = startPos;
        const startWorld = gridToWorld(startPos.x, startPos.y);
        gameState.player.worldPosition = { 
            x: startWorld.x, 
            y: 1.6, 
            z: startWorld.z 
        };
        
        // Reset visibility
        gameState.visibleTiles = computeVisibleTiles(dungeon.grid, startPos);
        gameState.exploredTiles = updateExploredTiles(new Set(), gameState.visibleTiles);
        
        // Create entities from spawn data
        gameState.entities.enemies = dungeon.enemySpawns.map(spawn =>
            createEnemyEntity(spawn.type, spawn.position, newLevel)
        );
        gameState.entities.items = (dungeon.itemSpawns || []).map(spawn =>
            createItemFromSpawn(spawn)
        );
        
        // Build dungeon geometry
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const tile = dungeon.grid[y][x];
                const world = gridToWorld(x, y);
                const key = `${x},${y}`;
                
                if (tile === 'wall') {
                    const wall = createWall(THREE, world.x, world.z);
                    scene.add(wall);
                    dungeonMeshes.set(key, wall);
                } else if (tile === 'floor' || tile === 'door') {
                    const floor = createFloor(THREE, world.x, world.z, 'hidden');
                    scene.add(floor);
                    dungeonMeshes.set(key, floor);
                } else if (tile === 'stairs_down') {
                    const floor = createFloor(THREE, world.x, world.z, 'hidden');
                    scene.add(floor);
                    dungeonMeshes.set(key, floor);
                    
                    const stairs = createStairsDown(THREE, world.x, world.z);
                    scene.add(stairs);
                    dungeonMeshes.set(`${key}_stairs`, stairs);
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
        
        // Create enemy meshes
        for (const enemy of gameState.entities.enemies) {
            const config = ENEMY_TYPES[enemy.type];
            const world = gridToWorld(enemy.position.x, enemy.position.y);
            const mesh = createEnemy(THREE, config, world.x, world.z);
            mesh.visible = false; // Hidden until in visible range
            scene.add(mesh);
            enemyMeshes.set(enemy.id, mesh);
        }
        
        // Create item meshes
        for (const item of gameState.entities.items) {
            const world = gridToWorld(item.position.x, item.position.y);
            const mesh = createItem(THREE, item, world.x, world.z);
            mesh.visible = false; // Hidden until in visible range
            scene.add(mesh);
            itemMeshes.set(item.id, mesh);
        }
        
        // Update player mesh position
        playerMesh.position.set(
            gameState.player.worldPosition.x,
            0,
            gameState.player.worldPosition.z
        );
        
        // Update camera position
        camera.position.set(
            gameState.player.worldPosition.x,
            1.6,
            gameState.player.worldPosition.z
        );
        
        // Update visibility
        updateDungeonVisibility();
        updateEnemyVisibility();
        updateItemVisibility();
        updateLights();
        
        addLogMessage(`📍 Welcome to dungeon level ${newLevel}!`);
    }
    
    // Initial dungeon load
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
    
    // Create items from spawn data
    gameState.entities.items = (dungeon.itemSpawns || []).map(spawn =>
        createItemFromSpawn(spawn)
    );
    
    // Build dungeon geometry
    for (let y = 0; y < dungeon.height; y++) {
        for (let x = 0; x < dungeon.width; x++) {
            const tile = dungeon.grid[y][x];
            const world = gridToWorld(x, y);
            const key = `${x},${y}`;
            
            if (tile === 'wall') {
                const wall = createWall(THREE, world.x, world.z);
                scene.add(wall);
                dungeonMeshes.set(key, wall);
            } else if (tile === 'floor' || tile === 'door') {
                const floor = createFloor(THREE, world.x, world.z, 'hidden');
                scene.add(floor);
                dungeonMeshes.set(key, floor);
            } else if (tile === 'stairs_down') {
                const floor = createFloor(THREE, world.x, world.z, 'hidden');
                scene.add(floor);
                dungeonMeshes.set(key, floor);
                
                const stairs = createStairsDown(THREE, world.x, world.z);
                scene.add(stairs);
                dungeonMeshes.set(`${key}_stairs`, stairs);
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
    playerMesh = createPlayer(THREE);
    playerMesh.position.set(
        gameState.player.worldPosition.x,
        0,
        gameState.player.worldPosition.z
    );
    scene.add(playerMesh);
    
    // Position camera at player's starting location
    camera.position.set(
        gameState.player.worldPosition.x,
        1.6, // Eye height
        gameState.player.worldPosition.z
    );
    
    // Create enemy meshes
    for (const enemy of gameState.entities.enemies) {
        const config = ENEMY_TYPES[enemy.type];
        const world = gridToWorld(enemy.position.x, enemy.position.y);
        const mesh = createEnemy(THREE, config, world.x, world.z);
        mesh.visible = false; // Hidden until in visible range
        scene.add(mesh);
        enemyMeshes.set(enemy.id, mesh);
    }
    
    // Create item meshes
    for (const item of gameState.entities.items) {
        const world = gridToWorld(item.position.x, item.position.y);
        const mesh = createItem(THREE, item, world.x, world.z);
        mesh.visible = false; // Hidden until in visible range
        scene.add(mesh);
        itemMeshes.set(item.id, mesh);
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
    let lastTime = performance.now();
    
    // Combat log and action log
    const combatLog = [];
    const actionLog = []; // For display in UI
    const MAX_LOG_MESSAGES = 10;
    let gameOverLogged = false; // Track if game over has been logged
    
    /**
     * Add a message to the action log
     * @param {string} message - Message to add
     */
    function addLogMessage(message) {
        actionLog.push(message);
        if (actionLog.length > MAX_LOG_MESSAGES) {
            actionLog.shift(); // Remove oldest message
        }
    }
    
    // Track last HUD stats to avoid unnecessary updates
    let lastHUDStats = {
        hp: gameState.player.hp,
        maxHp: gameState.player.maxHp,
        hunger: gameState.player.hunger,
        maxHunger: gameState.player.maxHunger,
        level: gameState.player.level,
        turn: gameState.turnCount
    };
    
    // Helper functions for updating visibility (defined before being called below)
    /**
     * Update dungeon tile visibility
     */
    function updateDungeonVisibility() {
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const key = `${x},${y}`;
                const tile = dungeon.grid[y][x];
                
                const visible = gameState.visibleTiles.has(key);
                const explored = gameState.exploredTiles.has(key);
                
                // Handle walls - only visible if explored or currently visible
                if (tile === 'wall') {
                    const meshOrGroup = dungeonMeshes.get(key);
                    if (meshOrGroup) {
                        meshOrGroup.visible = visible || explored;
                        
                        // Darken explored walls that are not currently visible
                        const actualMesh = meshOrGroup.userData?.mesh || meshOrGroup;
                        if (actualMesh.material) {
                            const color = visible ? PALETTE.WALL : PALETTE.EXPLORED;
                            actualMesh.material.color.setHex(color);
                        }
                    }
                    continue;
                }
                
                const meshOrGroup = dungeonMeshes.get(key);
                if (meshOrGroup) {
                    meshOrGroup.visible = visible || explored;
                    
                    if (tile === 'floor' || tile === 'door') {
                        const visState = visible ? 'visible' : explored ? 'explored' : 'hidden';
                        const color = visState === 'visible' ? PALETTE.FLOOR : 
                                     visState === 'explored' ? PALETTE.EXPLORED : PALETTE.HIDDEN;
                        
                        // Handle group with userData.mesh (from addWhiteOutline)
                        const actualMesh = meshOrGroup.userData?.mesh || meshOrGroup;
                        if (actualMesh.material) {
                            actualMesh.material.color.setHex(color);
                        }
                    }
                }
                
                // Update stairs visibility if present
                if (tile === 'stairs_down') {
                    const stairsMesh = dungeonMeshes.get(`${key}_stairs`);
                    if (stairsMesh) {
                        stairsMesh.visible = visible || explored;
                    }
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
     * Update item visibility based on player's visible tiles
     */
    function updateItemVisibility() {
        for (const item of gameState.entities.items) {
            const mesh = itemMeshes.get(item.id);
            if (mesh) {
                const key = `${item.position.x},${item.position.y}`;
                mesh.visible = gameState.visibleTiles.has(key);
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
                addLogMessage(message); // Add to action log
                
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
     * Update HUD display (only if stats changed)
     */
    function updateHUD() {
        const currentStats = {
            hp: gameState.player.hp,
            maxHp: gameState.player.maxHp,
            hunger: gameState.player.hunger,
            maxHunger: gameState.player.maxHunger,
            level: gameState.player.level,
            turn: gameState.turnCount
        };
        
        // Check if stats changed
        if (JSON.stringify(currentStats) === JSON.stringify(lastHUDStats)) {
            return; // No update needed
        }
        
        lastHUDStats = currentStats;
        
        // Reuse existing canvas, just redraw content
        const ctx = hudCanvas.getContext('2d');
        
        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, hudCanvas.width, hudCanvas.height);
        
        // Redraw text
        ctx.font = 'Bold 30px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        let y = 10;
        const lineHeight = 40;
        
        // HP
        const hpPercent = currentStats.hp / currentStats.maxHp;
        const hpColor = hpPercent > 0.6 ? '#00ff00' : hpPercent > 0.3 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = hpColor;
        ctx.fillText(`HP: ${currentStats.hp}/${currentStats.maxHp}`, 10, y);
        y += lineHeight;
        
        // Hunger
        const hungerPercent = currentStats.hunger / currentStats.maxHunger;
        const hungerColor = hungerPercent > 0.5 ? '#00ff00' : hungerPercent > 0.2 ? '#ffaa00' : '#ff0000';
        ctx.fillStyle = hungerColor;
        ctx.fillText(`Hunger: ${currentStats.hunger}`, 10, y);
        y += lineHeight;
        
        // Level
        ctx.fillStyle = '#00ff00';
        ctx.fillText(`Level: ${currentStats.level}`, 10, y);
        y += lineHeight;
        
        // Turn
        ctx.fillText(`Turn: ${currentStats.turn}`, 10, y);
        
        hudTexture.needsUpdate = true;
    }
    
    // Initialize visibility on first frame
    updateDungeonVisibility();
    updateEnemyVisibility();
    updateItemVisibility();
    updateLights();
    
    // Add initial log message
    addLogMessage('Welcome to the dungeon! Use WASD to move, arrows to rotate.');
    addLogMessage('Explore and defeat enemies to progress.');
    
    /**
     * Update game state and render
     */
    function update() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        
        if (gameState.gameOver) {
            // Log game over message once using flag
            if (!gameOverLogged) {
                addLogMessage(`💀 GAME OVER: ${gameState.deathMessage}`);
                gameOverLogged = true;
            }
            return; // Stop updating if game over
        }
        
        // Read input from VR controller or keyboard
        const controller = renderer.xr.getController(0);
        const vrAxes = readJoystickAxes(controller);
        const kbAxes = keyboardState ? readKeyboardAxes(keyboardState) : { x: 0, y: 0 };
        
        // Combine VR and keyboard input (prioritize VR when both active)
        const axes = {
            x: vrAxes.x !== 0 ? vrAxes.x : kbAxes.x,
            y: vrAxes.y !== 0 ? vrAxes.y : kbAxes.y
        };
        
        const moveDelta = calculateMovementDelta(axes, deltaTime, 2.6, gameState.player.rotation);
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
                    
                    // Check if player found stairs
                    const tile = dungeon.grid[gridPos.y]?.[gridPos.x];
                    if (tile === 'stairs_down') {
                        addLogMessage('🎯 You found the stairs down!');
                    }
                    
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
                    const oldHunger = gameState.player.hunger;
                    gameState = advanceTurn(gameState);
                    playFootstepSound(0.2);
                    
                    // Check for hunger warnings
                    const newHunger = gameState.player.hunger;
                    if (newHunger <= 100 && oldHunger > 100) {
                        addLogMessage('⚠️ You are getting hungry!');
                    } else if (newHunger <= 50 && oldHunger > 50) {
                        addLogMessage('⚠️⚠️ You are very hungry!');
                    } else if (newHunger <= 20 && oldHunger > 20) {
                        addLogMessage('🚨 Critical: You are starving!');
                    }
                    
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
                
                // Log combat mode changes
                if (inCombat && !gameState.inCombatMode) {
                    addLogMessage('⚔️ Entered combat mode!');
                } else if (!inCombat && gameState.inCombatMode) {
                    addLogMessage('✓ Combat ended.');
                }
                
                gameState = setCombatMode(gameState, inCombat);
            }
        }
        
        // Update floor visibility
        updateDungeonVisibility();
        
        // Update enemy visibility
        updateEnemyVisibility();
        
        // Update item visibility
        updateItemVisibility();
        
        // Update room lights
        updateLights();
        
        // Show movement indicator in combat mode
        updateMovementIndicator();
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
    
    /**
     * Set player rotation (for external control like mouse)
     * @param {number} rotation - Rotation in radians
     */
    function setRotation(rotation) {
        gameState = updatePlayerRotation(gameState, rotation);
    }
    
    /**
     * Handle player interaction with the environment
     * @returns {boolean} True if an interaction was performed
     */
    function interact() {
        if (gameState.gameOver) return false;
        
        const position = gameState.player.position;
        const tile = dungeon.grid[position.y]?.[position.x];
        
        const interactables = findInteractablesAtPosition(
            position,
            gameState.entities,
            tile
        );
        
        const action = getInteractionAction(interactables);
        
        if (!action) {
            addLogMessage('Nothing to interact with here.');
            return false;
        }
        
        if (action.type === 'attack') {
            // Attack adjacent enemy
            const enemy = action.target;
            const result = executeAttack(gameState.player, enemy);
            const message = getCombatMessage('Player', enemy.name, result);
            addLogMessage(message);
            
            if (result.hit) {
                playCombatHitSound(0.3);
                
                // Update enemy HP
                enemy.hp -= result.damage;
                if (enemy.hp <= 0) {
                    enemy.isAlive = false;
                    addLogMessage(`💀 ${enemy.name} defeated!`);
                    
                    // Award XP (simplified - just use xpValue from entity)
                    const xpGained = enemy.xpValue || 50;
                    addLogMessage(`+${xpGained} XP`);
                }
            }
            
            // Process enemy turns after player attack
            processEnemies();
            updateHUD();
            
            return true;
        }
        
        if (action.type === 'pickup') {
            // Pick up item
            const item = action.target;
            
            // Handle gold separately
            if (item.type === ITEM_TYPES.GOLD) {
                gameState = addGold(gameState, item.amount);
                gameState = removeItemFromWorld(gameState, item.id);
                
                // Remove item mesh from scene
                const mesh = itemMeshes.get(item.id);
                if (mesh) {
                    scene.remove(mesh);
                    itemMeshes.delete(item.id);
                }
                
                addLogMessage(`💰 Picked up ${item.amount} gold!`);
                return true;
            }
            
            // Try to add to inventory
            const result = addItemToInventory(gameState, item);
            gameState = result;
            
            if (result.success) {
                gameState = removeItemFromWorld(gameState, item.id);
                
                // Remove item mesh from scene
                const mesh = itemMeshes.get(item.id);
                if (mesh) {
                    scene.remove(mesh);
                    itemMeshes.delete(item.id);
                }
                
                const letter = getSlotLetter(result.slot);
                addLogMessage(`📦 Picked up ${item.name || 'item'} (${letter})`);
            } else {
                addLogMessage('⚠️ Inventory is full!');
            }
            
            return result.success;
        }
        
        if (action.type === 'descend') {
            // Descend stairs
            const currentLevel = gameState.dungeon.level;
            const nextLevel = currentLevel + 1;
            
            addLogMessage('⬇️ Descending to the next level...');
            
            // Load new dungeon level
            loadNewDungeonLevel(nextLevel);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Get inventory display state
     * @returns {object} {visible: boolean, items: Array<string>}
     */
    function getInventoryState() {
        return {
            visible: inventoryVisible,
            items: getInventoryDisplay(gameState.inventory)
        };
    }
    
    /**
     * Toggle inventory display
     */
    function toggleInventory() {
        inventoryVisible = !inventoryVisible;
        addLogMessage(inventoryVisible ? '📋 Inventory opened' : '📋 Inventory closed');
    }
    
    // Track inventory visibility state
    let inventoryVisible = false;
    
    return {
        update,
        dispose,
        getState: () => gameState,
        getCombatLog: () => combatLog,
        getActionLog: () => actionLog,
        setRotation,
        interact,
        getInventoryState,
        toggleInventory
    };
}
