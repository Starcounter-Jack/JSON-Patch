# Contributing

## Making changes in TypeScript

Make sure that you edit the source files in TypeScript (`*.ts`) files.

To install the TypeScript compiler, run `npm install -g typescript`.

You can build TypeScript to JavaScript using the [`TypeScript compiler`](https://www.typescriptlang.org/docs/tutorial.html)
(and run it with npm script: `npm run tsc`).

## Testing

### In a web browser

#### Testing

 - Load `test/` in your web browser

Each of the test suite files contains *Jasmine* unit test suite and *Benchmark.js* performance test suite.

To run *Benchmark.js* performance tests, press "Run Tests" button.

#### Automated, in Chromium, Firefox and WebKit

1. Download the browsers once: `npx playwright install` (on Linux, `npx playwright install --with-deps` also installs the system libraries they need)
2. Run `npm run test-browser`

### In Node.js

1. Go to directory where you have cloned the repo
2. Install dev dependencies (Jasmine Node.js module) by running command `npm install`. Use npm 11.10.0 or newer, as older versions ignore the `min-release-age` setting in `.npmrc`.
3. Run test `npm run test`
 - Testing **`core`** only: `npm run test-core`
 - Testing **`duplex`** only: `npm run test-duplex`
 - Testing the browser bundles in `dist/`: `npm run build && npm run test-dist`
4. Run test `npm run bench` (Please, consider performance when making any change)
 - Testing **`core*`* only: `npm run bench-core`
 - Testing **`duplex`** only: `npm run bench-duplex`


## Releasing a new version

**The release is done from `master` branch.**

1. Don't break too much. See [how many projects depend on this](https://www.npmjs.com/browse/depended/fast-json-patch).
2. Make sure that the browser tests pass `npm run test-browser`
3. Make sure that the NodeJS tests pass `npm install && npm run test`
4. Execute `npm version` like (`npm version [ major | minor | patch | premajor | preminor | prepatch | prerelease] --ignore-scripts=false`). Its `version` script transpiles, bundles and minifies, and adds the result to the version commit. The flag is needed because `.npmrc` sets `ignore-scripts=true`, which would skip that script. `.npmrc` also sets `sign-git-tag=true`, so the tag is signed with your GPG key.
5. `master` takes changes only through pull requests, so push the version commit to a branch (`git push origin HEAD:release-v<version>`), open a pull request to `master`, and merge it with "Create a merge commit", so the tagged commit is on `master`.
6. Call `git push origin v<version>` to push the tag. The tag starts the [Release workflow](.github/workflows/release.yml). Its `build` job runs the tests, rebuilds the package from the tagged sources, fails if the rebuild differs from the committed build output, and packs the package; the run summary shows the packed files and their integrity.
7. Approve the `publish` job in GitHub Actions (the `release` environment). It stages the tarball on npm through trusted publishing, with provenance. Don't run `npm publish` yourself.
8. Approve the staged version with 2FA, in the package's "Staged Packages" tab on npmjs.com or with `npm stage approve <stage-id>` (`npm stage list fast-json-patch` shows the id). Check first that its integrity matches the run summary; `npm stage download <stage-id>` gets the tarball for a closer look.
9. Call `npm view fast-json-patch dist-tags` to verify that the new version was published in NPM.
10. Explain the changes (at least a summary of the commit log) in [GitHub Releases](https://github.com/Starcounter-Jack/JSON-Patch/releases).
