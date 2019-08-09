const jsonpatch = require('../../..');

describe('CommonJS', function () {
    describe('require', function () {
        it('should have the expected structure', function () {
            expect(typeof jsonpatch).toEqual("object");
            expect(typeof jsonpatch).not.toEqual("function");
            expect(jsonpatch.applyOperation).toBeDefined();
            expect(jsonpatch.applyPatch).toBeDefined();
            expect(jsonpatch.applyReducer).toBeDefined();
            expect(jsonpatch.getValueByPointer).toBeDefined();
            expect(jsonpatch.validate).toBeDefined();
            expect(jsonpatch.validator).toBeDefined();
            expect(jsonpatch.JsonPatchError).toBeDefined();
            expect(jsonpatch.deepClone).toBeDefined();
            expect(jsonpatch.escapePathComponent).toBeDefined();
            expect(jsonpatch.unescapePathComponent).toBeDefined();
            expect(jsonpatch.unobserve).toBeDefined();
            expect(jsonpatch.observe).toBeDefined();
            expect(jsonpatch.generate).toBeDefined();
            expect(jsonpatch.compare).toBeDefined();
        });
    });
});