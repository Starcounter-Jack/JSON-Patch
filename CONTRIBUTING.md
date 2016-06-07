# Contributing

## Making changes in TypeScript

Make sure that you edit the source files in TypeScript (`*.ts`) files.

You can build TypeScript to JavaScript using the [`TypeScript compiler`](https://www.typescriptlang.org/docs/tutorial.html).

Make sure that you commit changes to both `ts` and `js` files.

## Releasing a new version

**The release is done from `master` branch.**

1. Don't break too much. See [how many projects depend on this](https://www.npmjs.com/browse/depended/fast-json-patch).
2. Make sure that the browser tests pass in Chrome, Firefox, Edge and IE
3. Make sure that the NodeJS tests pass `npm install && npm run test`
4. Call `grunt uglify`. This updates the minified files in the `dist` directory.
5. Call `git status` to verify that the only pending changes in the repo are the result of the previous step
5. Call `grunt bump:patch`, `grunt bump:minor` or `grunt bump:major`. This command:
 - increments the version number in the relevant files
 - commits changes to Git with the version number as the commit message
 - creates a Git tag wit the version
9. Call `git push` to push the changes to `origin master`
10. Call `git push --tags` to push the tag to `origin master`
11. Call `npm publish` to push the new version to NPM. [Read more](https://docs.npmjs.com/getting-started/publishing-npm-packages)
12. Call `npm view fast-json-patch dist-tags` to verify that the new version was published in NPM.
13. Explain the changes (at least an summary of the commit log) in [GitHub Releases](https://github.com/Starcounter-Jack/JSON-Patch/releases).
