export default {
  testEnvironment: 'jsdom',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/game-controller.js',  // Integration module - tested in browser
    '!src/rogue/audio-generator.js',  // Web Audio API - tested in browser
    '!src/rogue/render-utils.js'  // Three.js rendering - difficult to test without browser
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  transform: {}
};
