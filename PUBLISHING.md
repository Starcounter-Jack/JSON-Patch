# Publishing Guide for Modernized fast-json-patch

## Version Strategy

### Current Version
- **Current**: 3.1.1
- **Recommended Next**: 4.0.0-beta.1

### Why Major Version Bump (4.0.0)?

**Breaking Changes:**
1. **Node.js requirement**: Now requires Node 14+ (was implicitly any version)
2. **Package structure**: Changed from `commonjs/`, `module/`, `dist/` to just `dist/`
3. **Module type**: Package now has `"type": "module"`
4. **Minimum requirements**: Drops support for Node < 14

**Non-Breaking (but significant):**
- TypeScript upgraded from 3.5 to 5.6
- Build system completely changed
- Development dependencies modernized

### Recommended Versioning Path

#### Option 1: Beta Release First (Recommended)
```
3.1.1 (current)
  ↓
4.0.0-beta.1 (first beta - test with community)
  ↓
4.0.0-beta.2 (if fixes needed)
  ↓
4.0.0-rc.1 (release candidate)
  ↓
4.0.0 (stable release)
```

**Advantages:**
- Community can test before stable release
- Catch issues early
- Gradual adoption
- Can iterate on feedback

#### Option 2: Direct Major Release
```
3.1.1 (current)
  ↓
4.0.0 (stable release)
```

**Advantages:**
- Simpler process
- Faster adoption
- Less confusion with version tags

**Use this if:**
- You've thoroughly tested
- Breaking changes are minimal for most users
- You're confident in the changes

## Pre-Publishing Checklist

### 1. Update Version in package.json

```bash
# For beta release
npm version 4.0.0-beta.1 --no-git-tag-version

# For stable release
npm version 4.0.0 --no-git-tag-version
```

### 2. Verify Package Contents

```bash
# See what will be published
npm pack --dry-run

# Create actual tarball to inspect
npm pack
tar -tzf fast-json-patch-4.0.0-beta.1.tgz

# Clean up
rm fast-json-patch-*.tgz
```

### 3. Test the Build

```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build

# Verify dist/ contents
ls -lh dist/
```

### 4. Test Locally Before Publishing

```bash
# Create a test project
mkdir /tmp/test-json-patch
cd /tmp/test-json-patch
npm init -y

# Install from local tarball
npm pack /home/user/JSON-Patch
npm install fast-json-patch-4.0.0-beta.1.tgz

# Test ESM
cat > test-esm.mjs << 'EOF'
import * as jsonpatch from 'fast-json-patch';
console.log('ESM import works!', typeof jsonpatch.applyPatch);
EOF
node test-esm.mjs

# Test CJS
cat > test-cjs.cjs << 'EOF'
const jsonpatch = require('fast-json-patch');
console.log('CJS require works!', typeof jsonpatch.applyPatch);
EOF
node test-cjs.cjs

# Test TypeScript
npm install -D typescript @types/node
cat > test-ts.ts << 'EOF'
import { applyPatch, Operation } from 'fast-json-patch';
const doc = { foo: 'bar' };
const patch: Operation[] = [{ op: 'replace', path: '/foo', value: 'baz' }];
const result = applyPatch(doc, patch);
console.log('TypeScript works!', result);
EOF
npx tsx test-ts.ts
```

### 5. Update Documentation

Before publishing, update:
- [ ] README.md with new installation/usage
- [ ] CHANGELOG.md with version changes
- [ ] Migration guide for v3 → v4
- [ ] Any breaking changes documentation

## Publishing Commands

### For Beta/Alpha Releases

```bash
# Publish beta to npm (tagged as 'beta')
npm publish --tag beta

# Users install with:
# npm install fast-json-patch@beta
```

### For Stable Release

```bash
# Publish to npm (tagged as 'latest')
npm publish

# Users install with:
# npm install fast-json-patch
```

### Important npm Publish Flags

```bash
# Dry run (see what would happen)
npm publish --dry-run

# Publish with specific tag
npm publish --tag next
npm publish --tag beta
npm publish --tag canary

# Publish with access level
npm publish --access public  # For scoped packages
```

## Managing npm Tags

```bash
# List all tags
npm dist-tag ls fast-json-patch

# Add a tag to a version
npm dist-tag add fast-json-patch@4.0.0-beta.1 beta

# Remove a tag
npm dist-tag rm fast-json-patch beta

# Move 'latest' tag to new version
npm dist-tag add fast-json-patch@4.0.0 latest
```

## Complete Publishing Workflow

### For Beta Release:

```bash
# 1. Ensure you're on the modernization branch
git checkout claude/modernize-json-patch-011CUQjfJAcf3YCRyKi621NL

# 2. Update version
npm version 4.0.0-beta.1 --no-git-tag-version

# 3. Update CHANGELOG
# (manual edit)

# 4. Commit version bump
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: Bump version to 4.0.0-beta.1"

# 5. Build
npm run build

# 6. Verify package contents
npm pack --dry-run

# 7. Test locally (see above section)

# 8. Login to npm (if needed)
npm login

# 9. Publish as beta
npm publish --tag beta

# 10. Tag in git
git tag v4.0.0-beta.1
git push origin v4.0.0-beta.1

# 11. Announce
echo "Published! Users can install with: npm install fast-json-patch@beta"
```

### For Stable Release:

```bash
# After beta testing is complete...

# 1. Update version to stable
npm version 4.0.0 --no-git-tag-version

# 2. Update CHANGELOG with final release notes
# (manual edit)

# 3. Commit
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: Release v4.0.0"

# 4. Build
npm run build

# 5. Publish
npm publish

# 6. Tag and push
git tag v4.0.0
git push origin v4.0.0

# 7. Create GitHub Release
# (manual via GitHub UI or gh CLI)
```

## Testing After Publishing

```bash
# Install from npm
npm install fast-json-patch@beta

# Verify version
npm list fast-json-patch

# Test imports
node -e "console.log(require('fast-json-patch'))"
node -e "import('fast-json-patch').then(m => console.log(m))"
```

## Rollback Strategy

If you need to unpublish or fix:

```bash
# Unpublish a version (within 72 hours of publishing)
npm unpublish fast-json-patch@4.0.0-beta.1

# Deprecate a version (preferred over unpublish)
npm deprecate fast-json-patch@4.0.0-beta.1 "This version has issues, use 4.0.0-beta.2 instead"

# Move 'latest' tag back to previous version
npm dist-tag add fast-json-patch@3.1.1 latest
```

## Communication Plan

### When Publishing Beta:

1. **GitHub Release** with notes:
   - What's new
   - Breaking changes
   - How to test
   - How to provide feedback

2. **README badge**:
   ```markdown
   ## Beta Version Available

   Try the modernized v4 beta:
   \`\`\`bash
   npm install fast-json-patch@beta
   \`\`\`

   [See MODERNIZATION.md for details](./MODERNIZATION.md)
   ```

3. **Community announcement**:
   - Twitter/X
   - GitHub Discussions
   - Relevant Discord/Slack channels

### When Publishing Stable:

1. **GitHub Release** with full changelog
2. **Update README** removing beta notices
3. **Migration guide** from v3 to v4
4. **Blog post** (optional) about modernization

## Monitoring After Release

```bash
# Check download stats
npm info fast-json-patch

# Monitor for issues
# - GitHub Issues
# - npm security advisories
# - User feedback
```

## Recommended Timeline

### Week 1-2: Beta Testing
- Publish 4.0.0-beta.1
- Gather community feedback
- Fix any critical issues
- Publish 4.0.0-beta.2 if needed

### Week 3: Release Candidate
- Publish 4.0.0-rc.1
- Final testing
- Documentation review

### Week 4: Stable Release
- Publish 4.0.0
- Update all documentation
- Announcement

## Quick Reference Commands

```bash
# Check current version
npm version

# Bump version (pre-release)
npm version 4.0.0-beta.1 --no-git-tag-version

# Bump version (stable)
npm version major  # 3.1.1 -> 4.0.0

# See what would be published
npm pack --dry-run

# Publish beta
npm publish --tag beta

# Publish stable
npm publish

# Check published versions
npm info fast-json-patch versions

# Check current 'latest' tag
npm dist-tag ls fast-json-patch
```

## Common Issues and Solutions

### Issue: "You do not have permission to publish"
```bash
# Solution: Login to npm
npm login
# Or check you're logged in as correct user
npm whoami
```

### Issue: "Version already exists"
```bash
# Solution: Can't republish same version
# Either unpublish (if < 72hrs) or bump version
npm unpublish fast-json-patch@4.0.0-beta.1
# OR
npm version 4.0.0-beta.2
```

### Issue: "Package size too large"
```bash
# Solution: Check .npmignore is correct
npm pack --dry-run
# Should only include dist/, README.md, LICENSE.txt
```

### Issue: "Types not working after install"
```bash
# Verify types are in package
npm pack
tar -tzf fast-json-patch-*.tgz | grep .d.ts
# Should see dist/index.d.ts and dist/index.d.cts
```

---

## Next Steps

1. Create CHANGELOG.md (I can help with this)
2. Decide on beta vs. direct release
3. Test package locally
4. Publish beta version
5. Gather feedback
6. Release stable 4.0.0
