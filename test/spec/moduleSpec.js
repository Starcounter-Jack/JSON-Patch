import { applyPatch } from "../../module/core.js";

describe('ECMAScript module', function () {
    it('should apply patch on an object', function () {
        const obj = {};

        applyPatch(obj, [
            {
                op: 'add',
                path: '/bar',
                value: [1, 2, 3, 4]
            }
        ]);

        expect(obj.bar).toEqual([1, 2, 3, 4]);
    });
});