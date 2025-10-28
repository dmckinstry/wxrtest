# wxrtest

A simple WebXR "Hello World" application compatible with Meta Quest and other WebXR-enabled devices.

## Features

- Displays "HELLO WORLD" text in 3D space
- Animated rotating cube
- Full WebXR VR support
- Compatible with Meta Quest headsets
- Grid floor for spatial reference
- Controller support

## Prerequisites

- A WebXR-compatible browser (e.g., Chrome, Edge, Firefox Reality)
- For local testing: Node.js and npm (optional, for development server)
- For Meta Quest: Meta Quest Browser or other WebXR-enabled browser

## Quick Start

### Option 1: Direct File Opening
Simply open `index.html` in a WebXR-compatible browser. Note that for full WebXR functionality, you'll need to serve it over HTTPS or localhost.

### Option 2: Using Development Server (Recommended)

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser to `http://localhost:8080`

### Option 3: Deploy to a Web Server
Upload the `index.html` file to any web server with HTTPS enabled, then access it from your Meta Quest browser.

## Testing on Meta Quest

1. Make sure your application is served over HTTPS (required for WebXR)
2. Open the Meta Quest Browser on your headset
3. Navigate to your application URL
4. Click the "Enter VR" button
5. Put on your headset and enjoy the "Hello World" experience!

## Development

The application uses Three.js (loaded via CDN) for 3D rendering and WebXR support. The main components are:

- **Scene Setup**: 3D environment with lighting and camera
- **Text Display**: "HELLO WORLD" rendered on a textured plane
- **Animation**: Gentle rotation of text and cube
- **VR Controls**: Full WebXR controller support

### Testing

The project includes a comprehensive test suite following TDD best practices:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Test Coverage**: 100% (Statements, Branches, Functions, Lines)

The test suite covers utility functions including:
- Canvas text rendering
- Aspect ratio calculations
- Rotation animations
- Configuration validation
- Color validation

For more details, see [tests/README.md](tests/README.md).

## Browser Compatibility

- Meta Quest Browser (recommended for Meta Quest)
- Chrome/Edge with WebXR support
- Firefox Reality
- Other WebXR-enabled browsers

## Notes

- WebXR requires HTTPS in production (localhost works for development)
- The application automatically detects WebXR support and displays appropriate UI
- Controllers will be tracked automatically when in VR mode

## License

MIT