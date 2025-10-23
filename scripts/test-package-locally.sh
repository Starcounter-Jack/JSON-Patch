#!/bin/bash
set -e

echo "🧪 Testing package locally..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Create temp directory
TEST_DIR=$(mktemp -d)
echo "📁 Created test directory: $TEST_DIR"
cd "$TEST_DIR"

# Get package path
PACKAGE_DIR="${1:-/home/user/JSON-Patch}"
echo "📦 Testing package from: $PACKAGE_DIR"
echo ""

# Create package tarball
cd "$PACKAGE_DIR"
TARBALL=$(npm pack 2>&1 | tail -1)
TARBALL_PATH="$PACKAGE_DIR/$TARBALL"
echo "Created tarball: $TARBALL_PATH"
echo ""

# Setup test project
cd "$TEST_DIR"
npm init -y > /dev/null 2>&1
npm install "$TARBALL_PATH" > /dev/null 2>&1

echo "✓ Package installed"
echo ""

# Test ESM import
echo "Testing ESM import..."
cat > test-esm.mjs << 'EOF'
import * as jsonpatch from 'fast-json-patch';
import { applyPatch, Operation } from 'fast-json-patch';

const doc = { foo: 'bar', baz: [1, 2, 3] };
const patches = [
  { op: 'replace', path: '/foo', value: 'updated' },
  { op: 'add', path: '/baz/3', value: 4 }
];

const result = applyPatch(doc, patches);
console.log('✓ ESM import works!');
console.log('  Result:', JSON.stringify(result.newDocument));

if (result.newDocument.foo !== 'updated') {
  console.error('❌ ESM test failed: incorrect result');
  process.exit(1);
}
EOF

if node test-esm.mjs; then
    echo -e "${GREEN}✓ ESM test passed${NC}"
else
    echo -e "${RED}❌ ESM test failed${NC}"
    exit 1
fi
echo ""

# Test CommonJS require
echo "Testing CommonJS require..."
cat > test-cjs.cjs << 'EOF'
const jsonpatch = require('fast-json-patch');

const doc = { foo: 'bar' };
const patches = [{ op: 'replace', path: '/foo', value: 'updated' }];

const result = jsonpatch.applyPatch(doc, patches);
console.log('✓ CommonJS require works!');
console.log('  Result:', JSON.stringify(result.newDocument));

if (result.newDocument.foo !== 'updated') {
  console.error('❌ CJS test failed: incorrect result');
  process.exit(1);
}
EOF

if node test-cjs.cjs; then
    echo -e "${GREEN}✓ CommonJS test passed${NC}"
else
    echo -e "${RED}❌ CommonJS test failed${NC}"
    exit 1
fi
echo ""

# Test TypeScript
echo "Testing TypeScript..."
npm install -D typescript tsx @types/node > /dev/null 2>&1

cat > test-ts.ts << 'EOF'
import { applyPatch, Operation } from 'fast-json-patch';

const doc = { foo: 'bar', baz: [1, 2, 3] };
const patches: Operation[] = [
  { op: 'replace', path: '/foo', value: 'updated' },
  { op: 'add', path: '/baz/3', value: 4 }
];

const result = applyPatch(doc, patches);
console.log('✓ TypeScript works!');
console.log('  Result:', JSON.stringify(result.newDocument));

if (result.newDocument.foo !== 'updated') {
  console.error('❌ TypeScript test failed: incorrect result');
  process.exit(1);
}
EOF

if npx tsx test-ts.ts; then
    echo -e "${GREEN}✓ TypeScript test passed${NC}"
else
    echo -e "${RED}❌ TypeScript test failed${NC}"
    exit 1
fi
echo ""

# Test type checking
echo "Testing TypeScript type checking..."
if npx tsc --noEmit test-ts.ts 2>&1 | grep -q "error TS"; then
    echo -e "${RED}❌ TypeScript type check failed${NC}"
    npx tsc --noEmit test-ts.ts
    exit 1
else
    echo -e "${GREEN}✓ TypeScript type check passed${NC}"
fi
echo ""

# Cleanup
cd /
rm -rf "$TEST_DIR"
rm -f "$TARBALL_PATH"

echo ""
echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo "The package is ready to publish."
