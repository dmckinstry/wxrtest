# WebXR Tests

This directory contains unit tests for the WebXR application following TDD best practices.

## Test Structure

```
tests/
└── unit/
    └── webxr-utils.test.js    # Unit tests for utility functions
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Coverage

Current test coverage: **100%**

- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

## Test Framework

- **Jest**: Testing framework
- **@jest/globals**: ES module support
- **jest-environment-jsdom**: DOM environment for browser-like testing
- **canvas**: Canvas API implementation for Node.js testing

## Tested Functions

### `createTextCanvas(text, width, height, options)`
Creates a canvas element with rendered text. Tests cover:
- Default dimensions
- Custom dimensions
- Text rendering
- Custom styling options

### `calculateAspectRatio(width, height)`
Calculates the aspect ratio of a viewport. Tests cover:
- Standard aspect ratios (16:9, 4:3)
- Square dimensions
- Portrait orientation
- Error handling for zero height

### `calculateRotation(time, speed)`
Calculates rotation value based on time. Tests cover:
- Time-based rotation
- Custom speed multipliers
- Zero time handling
- Negative time values

### `validateConfig(config)`
Validates WebXR configuration object. Tests cover:
- Valid configurations
- Null/undefined handling
- Non-object types
- Missing required properties (camera, renderer, scene)

### `calculateCubeRotation(currentRotation, increment)`
Calculates incremental rotation for animations. Tests cover:
- Default increment values
- Custom increment values
- Existing rotation values
- Negative increments
- Accumulated rotations

### `validateColor(color)`
Validates hex color values. Tests cover:
- Valid hex colors
- Non-number values
- Out of range values
- Boundary values (0x000000, 0xffffff)

## Best Practices

This test suite follows TDD best practices:

1. **Test-First Approach**: Functions were extracted with tests in mind
2. **AAA Pattern**: Tests follow Arrange-Act-Assert structure
3. **Descriptive Names**: Test names clearly describe what is being tested
4. **Edge Cases**: Tests cover boundary conditions and error cases
5. **Isolation**: Each test is independent and can run in any order
6. **Coverage**: All code paths are tested

## Future Enhancements

Potential areas for additional testing:
- Integration tests for Three.js scene setup
- E2E tests for WebXR interactions
- Performance tests for animation loops
- Browser compatibility tests
