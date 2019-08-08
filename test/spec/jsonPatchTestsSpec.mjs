import * as jsonpatch from '../../index.mjs';

import tests_json from './json-patch-tests/tests.json.mjs';
import spec_tests_json from './json-patch-tests/spec_tests.json.mjs';

const JSONtests = [
  {
    name: 'tests.json',
    tests: tests_json
  },
  {
    name: 'spec_tests.json',
    tests: spec_tests_json
  }
];

if (typeof Array.prototype.forEach != 'function') {
  Array.prototype.forEach = function(callback) {
    for (const i = 0; i < this.length; i++) {
      callback.apply(this, [this[i], i, this]);
    }
  };
}

describe('json-patch-tests', function() {
  JSONtests.forEach(function(jsonTest) {
    describe(jsonTest.name, function() {
      jsonTest.tests.forEach(function(test) {
        if (test.disabled) {
          return;
        }
        const testName = test.comment || test.error || JSON.stringify(test.patch);
        if (test.expected) {
          it('should succeed: ' + testName, function() {
            const results = jsonpatch.applyPatch(test.doc, test.patch, true);
            test.doc = results.newDocument;
            expect(test.doc).toEqual(test.expected);
          });
        } else if (test.error || test.patch[0].op === 'test') {
          it('should throw an error: ' + testName, function() {
            let errors = 0;
            try {
              const res = jsonpatch.applyPatch(test.doc, test.patch, true);
              if (res.test === false) {
                throw new Error('Test failed');
              }
            } catch (e) {
              errors++;
            }
            if (test.error) {
              expect(errors).toBe(1);
            } else {
              expect(errors).toBe(0);
            }
          });
        } else {
          throw new Error('invalid test case');
        }
      });
    });
  });
});