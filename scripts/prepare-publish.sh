#!/bin/bash
set -e

echo "🚀 Preparing package for publishing..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if logged in to npm
echo "📦 Checking npm authentication..."
if ! npm whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to npm${NC}"
    echo "Run: npm login"
    exit 1
fi
echo -e "${GREEN}✓ Logged in as $(npm whoami)${NC}"
echo ""

# Clean and build
echo "🧹 Cleaning old build..."
rm -rf dist/
echo -e "${GREEN}✓ Cleaned${NC}"
echo ""

echo "📦 Installing dependencies..."
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo "🔨 Building package..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Check dist/ contents
echo "📋 Package contents:"
ls -lh dist/
echo ""

# Verify critical files exist
REQUIRED_FILES=("dist/index.js" "dist/index.cjs" "dist/index.d.ts" "dist/index.d.cts")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing required file: $file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ All required files present${NC}"
echo ""

# Show what will be published
echo "📦 Files that will be published:"
npm pack --dry-run 2>&1 | grep -E "^(npm notice|package size|unpacked size)" || true
echo ""

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}Current version: $CURRENT_VERSION${NC}"
echo ""

# Offer to test locally
echo -e "${YELLOW}Would you like to create a test tarball? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    npm pack
    TARBALL="fast-json-patch-${CURRENT_VERSION}.tgz"
    echo -e "${GREEN}✓ Created $TARBALL${NC}"
    echo ""
    echo "Test it locally with:"
    echo "  mkdir /tmp/test-pkg && cd /tmp/test-pkg"
    echo "  npm init -y"
    echo "  npm install $(pwd)/$TARBALL"
    echo ""
fi

echo "Ready to publish!"
echo ""
echo "Choose your publishing strategy:"
echo ""
echo "For beta release:"
echo "  1. npm version 4.0.0-beta.1 --no-git-tag-version"
echo "  2. git add package.json package-lock.json"
echo "  3. git commit -m 'chore: Bump version to 4.0.0-beta.1'"
echo "  4. npm publish --tag beta"
echo "  5. git tag v4.0.0-beta.1 && git push --tags"
echo ""
echo "For stable release:"
echo "  1. npm version 4.0.0 --no-git-tag-version"
echo "  2. git add package.json package-lock.json"
echo "  3. git commit -m 'chore: Release v4.0.0'"
echo "  4. npm publish"
echo "  5. git tag v4.0.0 && git push --tags"
echo ""
echo -e "${YELLOW}See PUBLISHING.md for complete details${NC}"
