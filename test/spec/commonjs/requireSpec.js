const jsonpatch = require('../../..');

describe('CommonJS', function () {
    describe('require', function () {
        it('should have the expected structure', function () {
            expect(typeof jsonpatch).withContext("result from require() should be an object").toEqual("object");
            expect(typeof jsonpatch).withContext("result from require() should not be a function").not.toEqual("function");
            expect(jsonpatch.applyOperation).withContext("applyOperation should be a method within the object").toBeDefined();
            expect(jsonpatch.applyPatch).withContext("applyPatch should be a method within the object").toBeDefined();
            expect(jsonpatch.applyReducer).withContext("applyReducer should be a method within the object").toBeDefined();
            expect(jsonpatch.getValueByPointer).withContext("getValueByPointer should be a method within the object").toBeDefined();
            expect(jsonpatch.validate).withContext("validate should be a method within the object").toBeDefined();
            expect(jsonpatch.validator).withContext("validator should be a method within the object").toBeDefined();
            expect(jsonpatch._areEquals).withContext("_areEquals should be a method within the object").toBeDefined();
            expect(jsonpatch.JsonPatchError).withContext("JsonPatchError should be a method within the object").toBeDefined();
            expect(jsonpatch.deepClone).withContext("deepClone should be a method within the object").toBeDefined();
            expect(jsonpatch.escapePathComponent).withContext("escapePathComponent should be a method within the object").toBeDefined();
            expect(jsonpatch.unescapePathComponent).withContext("unescapePathComponent should be a method within the object").toBeDefined();
            expect(jsonpatch.unobserve).withContext("unobserve should be a method within the object").toBeDefined();
            expect(jsonpatch.observe).withContext("observe should be a method within the object").toBeDefined();
            expect(jsonpatch.generate).withContext("generate should be a method within the object").toBeDefined();
            expect(jsonpatch.compare).withContext("compare should be a method within the object").toBeDefined();
        });
    });
});