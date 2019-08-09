import jsonpatch from '../../..'; //as used in https://github.com/swagger-api/swagger-js/blob/397fc7af59eff1bf1608b580049dddf61da82b96/src/specmap/lib/index.js#L1
import * as jsonpatchStar from '../../..';
import { applyOperation } from '../../..';

describe('This package imported by Webpack', function () {
    describe('import default', function () {
        it('should have the expected structure', function () {
            verifyObjectStructure(jsonpatch);
        });
    });

    describe('import asterisk', function () {
        it('should have the expected structure', function () {
            verifyObjectStructure(jsonpatchStar);
        });
    });

    describe('named import', function () {
        it('should have the expected structure', function () {
            expect(applyOperation).toBeDefined();
        });
    });
});

function verifyObjectStructure(obj) {
    expect(typeof obj).toEqual("object");
    expect(typeof obj).not.toEqual("function");
    expect(obj.applyOperation).toBeDefined();
    expect(obj.applyPatch).toBeDefined();
    expect(obj.applyReducer).toBeDefined();
    expect(obj.getValueByPointer).toBeDefined();
    expect(obj.validate).toBeDefined();
    expect(obj.validator).toBeDefined();
    expect(obj.JsonPatchError).toBeDefined();
    expect(obj.deepClone).toBeDefined();
    expect(obj.escapePathComponent).toBeDefined();
    expect(obj.unescapePathComponent).toBeDefined();
    expect(obj.unobserve).toBeDefined();
    expect(obj.observe).toBeDefined();
    expect(obj.generate).toBeDefined();
    expect(obj.compare).toBeDefined();
}