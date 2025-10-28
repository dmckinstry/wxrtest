/**
 * Procedural Audio Generator
 * Generates procedural sounds using Web Audio API
 */

/**
 * Create audio context (singleton)
 */
let audioContext = null;

export function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

/**
 * Play a footstep sound (bass thump)
 * @param {number} volume - Volume (0-1)
 */
export function playFootstepSound(volume = 0.3) {
    const ctx = getAudioContext();
    
    // Create oscillator for bass thump
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(80, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
}

/**
 * Play a combat hit sound (mid-range hit)
 * @param {number} volume - Volume (0-1)
 */
export function playCombatHitSound(volume = 0.4) {
    const ctx = getAudioContext();
    
    // Create noise for impact
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    noise.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    noise.start(ctx.currentTime);
}

/**
 * Play a pickup sound (high-pitch ping)
 * @param {number} volume - Volume (0-1)
 */
export function playPickupSound(volume = 0.3) {
    const ctx = getAudioContext();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
}

/**
 * Play enemy death sound
 * @param {number} volume - Volume (0-1)
 */
export function playEnemyDeathSound(volume = 0.4) {
    const ctx = getAudioContext();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
}

/**
 * Create ambient dungeon drone
 * @param {number} volume - Volume (0-1)
 * @returns {object} {oscillator, gainNode, stop} Controllable drone
 */
export function createAmbientDrone(volume = 0.1) {
    const ctx = getAudioContext();
    
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(60, ctx.currentTime);
    
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(61, ctx.currentTime); // Slight detune for depth
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator1.start(ctx.currentTime);
    oscillator2.start(ctx.currentTime);
    
    return {
        oscillator1,
        oscillator2,
        gainNode,
        stop: () => {
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
            oscillator1.stop(ctx.currentTime + 1.1);
            oscillator2.stop(ctx.currentTime + 1.1);
        }
    };
}

/**
 * Create positional audio source (for use with Three.js)
 * @param {object} THREE - Three.js library
 * @param {object} listener - Three.js AudioListener
 * @param {number} frequency - Sound frequency
 * @param {number} volume - Volume (0-1)
 * @returns {object} PositionalAudio
 */
export function createPositionalSound(THREE, listener, frequency = 200, volume = 0.5) {
    const sound = new THREE.PositionalAudio(listener);
    
    const ctx = listener.context;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(sound.getInput());
    
    oscillator.start(ctx.currentTime);
    
    sound.setRefDistance(5);
    sound.setMaxDistance(20);
    
    return sound;
}

/**
 * Play level up sound
 * @param {number} volume - Volume (0-1)
 */
export function playLevelUpSound(volume = 0.5) {
    const ctx = getAudioContext();
    
    const frequencies = [400, 500, 600, 800];
    
    frequencies.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        
        const startTime = ctx.currentTime + index * 0.1;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
    });
}
