# Currency Denomination Distributor - Desktop App

This is the desktop application for the Currency Denomination Distributor system, built with Electron, React, TypeScript, and Tailwind CSS.

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

## Setup

1. Navigate to the desktop app directory:
   ```bash
   cd packages/desktop-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To start the application in development mode (with Hot Module Replacement):

```bash
npm run dev
```

This will launch the Electron window with the React application running inside.

## Building

To build the application for production:

```bash
npm run build
```

The output will be in the `dist` and `dist-electron` directories.

## Project Structure

- `electron/` - Electron main process code
- `src/` - React renderer process code
- `dist/` - Built assets
- `public/` - Static assets

## Integration

This desktop app connects to the local backend API running at `http://localhost:8001`. Ensure the backend is running before using the app.
