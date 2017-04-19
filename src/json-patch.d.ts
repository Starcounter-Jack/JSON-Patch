/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * json-patch-duplex.js version: 1.1.9
 * (c) 2013 Joachim Wester
 * MIT license
 */
declare module jsonpatch {
    /**
     * Apply a json-patch operation on an object tree
     * Returns an array of results of operations.
     * Each element can either be a boolean (if op == 'test') or
     * the removed object (operations that remove things)
     * or just be undefined
     */
    function apply(tree: any, patches: any[], validate?: boolean): Array<any>;
    class JsonPatchError extends Error {
        message: string;
        name: string;
        index: number;
        operation: any;
        tree: any;
        constructor(message: string, name: string, index?: number, operation?: any, tree?: any);
    }
    /**
     * Validates a single operation. Called from `jsonpatch.validate`. Throws `JsonPatchError` in case of an error.
     * @param {object} operation - operation object (patch)
     * @param {number} index - index of operation in the sequence
     * @param {object} [tree] - object where the operation is supposed to be applied
     * @param {string} [existingPathFragment] - comes along with `tree`
     */
    function validator(operation: any, index: number, tree?: any, existingPathFragment?: string): void;
    /**
     * Validates a sequence of operations. If `tree` parameter is provided, the sequence is additionally validated against the object tree.
     * If error is encountered, returns a JsonPatchError object
     * @param sequence
     * @param tree
     * @returns {JsonPatchError|undefined}
     */
    function validate(sequence: any[], tree?: any): JsonPatchError;
}
export default jsonpatch;
