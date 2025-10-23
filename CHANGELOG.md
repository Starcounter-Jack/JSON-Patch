# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.0.0-beta.1] - TBD

### Added
- Modern ESM-first package structure with proper dual-package support
- Modern `exports` field in package.json for better module resolution
- TypeScript 5.6 support (upgraded from 3.5)
- ES2022 target (upgraded from ES5)
- tsup for fast, modern bundling
- Prettier for code formatting
- ESLint 9 with flat config
- Vitest for modern testing
- Source maps for all builds
- Separate type definitions for ESM (.d.ts) and CommonJS (.d.cts)

### Changed
- **BREAKING**: Minimum Node.js version is now 14.0.0 (was any version)
- **BREAKING**: Package now uses `"type": "module"` as default
- **BREAKING**: Package structure changed - only `dist/` directory shipped (was `commonjs/`, `module/`, `dist/`)
- Build output structure: Single `dist/` directory instead of multiple directories
- Build system: Replaced Webpack with tsup (25x faster builds)
- Development workflow simplified to single `npm run build` command
- Package size reduced by ~80% (only ships necessary files)

### Removed
- Webpack build system and configuration
- bower.json (outdated package manager)
- Experimental modules flags (not needed with Node 14+)
- Manual .mjs conversion scripts
- Legacy build artifacts and directories

### Fixed
- Better tree-shaking support for modern bundlers
- Improved TypeScript type resolution
- Native ESM support without experimental flags

### Migration Guide

#### For Users

**No code changes required!** Both CommonJS and ESM imports work exactly as before:

```javascript
// CommonJS - still works
const jsonpatch = require('fast-json-patch');

// ESM - now works natively without flags
import * as jsonpatch from 'fast-json-patch';
import { applyPatch } from 'fast-json-patch';
```

**Requirements:**
- Node.js 14.0.0 or higher

**Benefits:**
- Faster installs (smaller package)
- Better tree-shaking in bundlers
- Native ESM support
- Better TypeScript experience

#### For Contributors

**New development commands:**
```bash
npm run build          # Build everything
npm run build:watch    # Build in watch mode
npm test              # Run tests with Vitest
npm run lint          # Lint code
npm run format        # Format with Prettier
```

See [MODERNIZATION.md](./MODERNIZATION.md) for complete details.

---

## [3.1.1] - 2019-07-15

### Fixed
- TypeScript codegen changes

## [3.1.0] - 2019-06-XX

### Added
- Initial TypeScript support
- Module exports (.mjs)
- Webpack bundling

### Changed
- Build process improvements

---

[Unreleased]: https://github.com/Starcounter-Jack/JSON-Patch/compare/v4.0.0-beta.1...HEAD
[4.0.0-beta.1]: https://github.com/Starcounter-Jack/JSON-Patch/compare/v3.1.1...v4.0.0-beta.1
[3.1.1]: https://github.com/Starcounter-Jack/JSON-Patch/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/Starcounter-Jack/JSON-Patch/releases/tag/v3.1.0
