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

### In Node.js

1. Go to directory where you have cloned the repo
2. Install dev dependencies (Jasmine Node.js module) by running command `npm install`
3. Run test `npm run test`
 - Testing **`core`** only: `npm run test-core`
 - Testing **`duplex`** only: `npm run test-duplex`
4. Run test `npm run bench` (Please, consider performance when making any change)
 - Testing **`core*`* only: `npm run bench-core`
 - Testing **`duplex`** only: `npm run bench-duplex`


## Releasing a new version

**The release is done from `master` branch.**

1. Don't break too much. See [how many projects depend on this](https://www.npmjs.com/browse/depended/fast-json-patch).
2. Make sure that the browser tests pass in Chrome, Firefox, Safari, Edge and IE11
3. Make sure that the NodeJS tests pass `npm install && npm run test`
4. Execute `npm run build` to transpile, bundle and minify.
5. Execute `npm version` like (`npm version [ major | minor | patch | premajor | preminor | prepatch | prerelease]`)
6. Call `git push` to push the changes to `origin master`
7. Call `git push --tags` to push the tag to `origin master`
8. Call `npm publish` to push the new version to NPM. [Read more](https://docs.npmjs.com/getting-started/publishing-npm-packages)
9. Call `npm view fast-json-patch dist-tags` to verify that the new version was published in NPM.
10. Explain the changes (at least a summary of the commit log) in [GitHub Releases](https://github.com/Starcounter-Jack/JSON-Patch/releases).
