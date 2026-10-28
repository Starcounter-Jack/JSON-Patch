/**
 * Smoke test for the browser bundles in `dist/`, loaded the way a `<script>`
 * tag loads them. Run it after `npm run build`. The browser suite imports
 * `index.mjs`, so it never loads the bundles themselves.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { version } = require('../../../package.json');
const api = require('../../../index.js');

const DIST_DIR = path.resolve(__dirname, '../../../dist');
const BUNDLES = ['fast-json-patch.js', 'fast-json-patch.min.js'];

describe('Browser bundles in dist/', function () {
    BUNDLES.forEach(function (file) {
        describe(file, function () {
            const source = fs.readFileSync(path.join(DIST_DIR, file), 'utf8');

            it('should keep the version banner', function () {
                expect(source).toContain('fast-json-patch, version: ' + version);
            });

            it('should define the `jsonpatch` global with the API of `index.js`', function () {
                const jsonpatch = loadAsScript(source);
                expect(Object.keys(jsonpatch).sort()).toEqual(Object.keys(api).sort());
            });

            it('should apply and generate patches', function () {
                const jsonpatch = loadAsScript(source);
                const doc = { list: [1, 2] };
                jsonpatch.applyPatch(doc, [{ op: 'add', path: '/list/-', value: 3 }]);
                expect(doc).toEqual({ list: [1, 2, 3] });
                // The patch is built in the bundle's own realm, so compare it as JSON
                expect(JSON.stringify(jsonpatch.compare({ a: 1 }, { a: 2 })))
                    .toBe('[{"op":"replace","path":"/a","value":2}]');
            });
        });
    });
});

// Runs the bundle in a fresh global scope, as a `<script>` tag would
function loadAsScript(source) {
    const context = vm.createContext({});
    vm.runInContext(source, context);
    return context.jsonpatch;
}
