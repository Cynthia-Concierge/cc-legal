# Firebase Functions

This directory contains Firebase Cloud Functions that wrap the Express API server.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build TypeScript:
   ```bash
   npm run build
   ```

3. Set environment variables (see FIREBASE_DEPLOYMENT.md)

## Current Status

The functions are set up with a basic structure. The Express server in `../server/index.ts` uses ES modules and top-level await, which needs to be converted for Firebase Functions (which uses CommonJS).

## Next Steps

To complete the migration, choose one of these approaches:

### Option 1: Convert Server to CommonJS
- Convert `server/index.ts` and all service files to CommonJS
- Update imports to use `require()` instead of `import`
- Remove top-level await

### Option 2: Use a Bundler
- Use esbuild or webpack to bundle the server code
- Convert ES modules to CommonJS during build
- Import the bundled code in `functions/src/index.ts`

### Option 3: Manual Route Migration
- Copy routes from `server/index.ts` to `functions/src/index.ts`
- Convert each route to CommonJS
- Import services using CommonJS syntax

### Option 4: Firebase Functions v2 (Experimental)
- Use Firebase Functions v2 which has better ES module support
- May require additional configuration

## Development

Run locally with Firebase emulators:
```bash
firebase emulators:start --only functions
```

Or from the root directory:
```bash
npm run build
firebase emulators:start
```

## Deployment

Deploy functions:
```bash
firebase deploy --only functions
```

Or deploy everything:
```bash
firebase deploy
```

