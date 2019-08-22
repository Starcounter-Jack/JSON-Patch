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
            expect(applyOperation).withContext("applyOperation should be defined").toBeDefined();
        });
    });
});

function verifyObjectStructure(obj) {
    expect(typeof obj).withContext("result from import should be an object").toEqual("object");
    expect(typeof obj).withContext("result from import should not be a function").not.toEqual("function");
    expect(obj.applyOperation).withContext("applyOperation should be a method within the object").toBeDefined();
    expect(obj.applyPatch).withContext("applyPatch should be a method within the object").toBeDefined();
    expect(obj.applyReducer).withContext("applyReducer should be a method within the object").toBeDefined();
    expect(obj.getValueByPointer).withContext("getValueByPointer should be a method within the object").toBeDefined();
    expect(obj.validate).withContext("validate should be a method within the object").toBeDefined();
    expect(obj.validator).withContext("validator should be a method within the object").toBeDefined();
    expect(obj._areEquals).withContext("_areEquals should be a method within the object").toBeDefined();
    expect(obj.JsonPatchError).withContext("JsonPatchError should be a method within the object").toBeDefined();
    expect(obj.deepClone).withContext("deepClone should be a method within the object").toBeDefined();
    expect(obj.escapePathComponent).withContext("escapePathComponent should be a method within the object").toBeDefined();
    expect(obj.unescapePathComponent).withContext("unescapePathComponent should be a method within the object").toBeDefined();
    expect(obj.unobserve).withContext("unobserve should be a method within the object").toBeDefined();
    expect(obj.observe).withContext("observe should be a method within the object").toBeDefined();
    expect(obj.generate).withContext("generate should be a method within the object").toBeDefined();
    expect(obj.compare).withContext("compare should be a method within the object").toBeDefined();
}