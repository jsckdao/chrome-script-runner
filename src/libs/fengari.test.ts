import { describe, it, expect } from 'vitest';
import { version } from './fengari-web';

describe('Fengari Version Info', () => {
  it('should export version info', () => {
    expect(version.FENGARI_VERSION).toBeTypeOf('string');
    expect(version.FENGARI_VERSION_MAJOR).toBeTypeOf('string');
    expect(version.FENGARI_VERSION_MINOR).toBeTypeOf('string');
    expect(version.FENGARI_VERSION_NUM).toBeTypeOf('number');
  });
});

/**
 * Note: Full integration tests for doString require a browser environment.
 * Fengari is designed for browser use and has compatibility issues with
 * Node.js test runners (vitest) due to how it handles memory and WASM.
 *
 * To test the extension functionality:
 * 1. Build the extension: pnpm build
 * 2. Load dist/ as unpacked Chrome extension
 * 3. Open the side panel and test Lua execution
 *
 * The TypeScript types are verified by successful compilation,
 * and the JS-Lua interop types are defined in src/libs/fengari-interop.ts
 */
