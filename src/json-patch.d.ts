/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * json-patch-duplex.js version: 1.1.10
 * (c) 2013 Joachim Wester
 * MIT license
 */
declare module jsonpatch {
    type Patch<T> = AddPatch<T> | RemovePatch | ReplacePatch<T> | MovePatch | CopyPatch | TestPatch<T>;
    interface PatchBase {
        path: string;
    }
    interface AddPatch<T> extends PatchBase {
        op: 'add';
        value: T;
    }
    interface RemovePatch extends PatchBase {
        op: 'remove';
    }
    interface ReplacePatch<T> extends PatchBase {
        op: 'replace';
        value: T;
    }
    interface MovePatch extends PatchBase {
        op: 'move';
        from: string;
    }
    interface CopyPatch extends PatchBase {
        op: 'copy';
        from: string;
    }
    interface TestPatch<T> extends PatchBase {
        op: 'test';
        value: T;
    }
    type JsonPatchErrorName = 'SEQUENCE_NOT_AN_ARRAY' | 'OPERATION_NOT_AN_OBJECT' | 'OPERATION_OP_INVALID' | 'OPERATION_PATH_INVALID' | 'OPERATION_FROM_REQUIRED' | 'OPERATION_VALUE_REQUIRED' | 'OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED' | 'OPERATION_PATH_CANNOT_ADD' | 'OPERATION_PATH_UNRESOLVABLE' | 'OPERATION_FROM_UNRESOLVABLE' | 'OPERATION_PATH_ILLEGAL_ARRAY_INDEX' | 'OPERATION_VALUE_OUT_OF_BOUNDS';
    /**
     * Apply a json-patch operation on an object tree
     * Returns an array of results of operations.
     * Each element can either be a boolean (if op == 'test') or
     * the removed object (operations that remove things)
     * or just be undefined
     */
    function apply(tree: any, patches: Patch<any>[], validate?: boolean): any[];
    class JsonPatchError extends Error {
        message: string;
        name: JsonPatchErrorName;
        index?: number;
        operation?: any;
        tree?: any;
        constructor(message: string, name: JsonPatchErrorName, index?: number, operation?: any, tree?: any);
    }
    /**
     * Validates a single operation. Called from `jsonpatch.validate`. Throws `JsonPatchError` in case of an error.
     * @param {object} operation - operation object (patch)
     * @param {number} index - index of operation in the sequence
     * @param {object} [tree] - object where the operation is supposed to be applied
     * @param {string} [existingPathFragment] - comes along with `tree`
     */
    function validator(operation: Patch<any>, index: number, tree?: any, existingPathFragment?: string): void;
    /**
     * Validates a sequence of operations. If `tree` parameter is provided, the sequence is additionally validated against the object tree.
     * If error is encountered, returns a JsonPatchError object
     * @param sequence
     * @param tree
     * @returns {JsonPatchError|undefined}
     */
    function validate(sequence: Patch<any>[], tree?: any): JsonPatchError;
}
export default jsonpatch;
