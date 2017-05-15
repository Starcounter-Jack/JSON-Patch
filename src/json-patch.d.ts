/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * json-patch-duplex.js version: 1.1.10
 * (c) 2013 Joachim Wester
 * MIT license
 */
declare namespace jsonpatch {
    type Operation = AddOperation<any> | RemoveOperation | ReplaceOperation<any> | MoveOperation | CopyOperation | TestOperation<any>;
    interface BaseOperation {
        path: string;
    }
    interface AddOperation<T> extends BaseOperation {
        op: 'add';
        value: T;
    }
    interface RemoveOperation extends BaseOperation {
        op: 'remove';
    }
    interface ReplaceOperation<T> extends BaseOperation {
        op: 'replace';
        value: T;
    }
    interface MoveOperation extends BaseOperation {
        op: 'move';
        from: string;
    }
    interface CopyOperation extends BaseOperation {
        op: 'copy';
        from: string;
    }
    interface TestOperation<T> extends BaseOperation {
        op: 'test';
        value: T;
    }
    /** DEPRECATED. Use `Operation` */
    type Patch<T> = Operation;
    /** DEPRECATED. Use `AddOperation` */
    type AddPatch<T> = AddOperation<T>;
    /** DEPRECATED. Use `RemoveOperation` */
    type RemovePatch = RemoveOperation;
    /** DEPRECATED. Use `ReplaceOperation` */
    type ReplacePatch<T> = ReplaceOperation<T>;
    /** DEPRECATED. Use `MoveOperation` */
    type MovePatch = MoveOperation;
    /** DEPRECATED. Use `CopyOperation` */
    type CopyPatch = CopyOperation;
    /** DEPRECATED. Use `TestOperation` */
    type TestPatch<T> = TestOperation<T>;
    type JsonPatchErrorName = 'SEQUENCE_NOT_AN_ARRAY' | 'OPERATION_NOT_AN_OBJECT' | 'OPERATION_OP_INVALID' | 'OPERATION_PATH_INVALID' | 'OPERATION_FROM_REQUIRED' | 'OPERATION_VALUE_REQUIRED' | 'OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED' | 'OPERATION_PATH_CANNOT_ADD' | 'OPERATION_PATH_UNRESOLVABLE' | 'OPERATION_FROM_UNRESOLVABLE' | 'OPERATION_PATH_ILLEGAL_ARRAY_INDEX' | 'OPERATION_VALUE_OUT_OF_BOUNDS' | 'TEST_OPERATION_FAILED';
    /**
     * Apply a single JSON Patch Operation on a JSON document.
     * Returns the updated document.
     * Suitable as a reducer.
     *
     * @param document The document to patch
     * @param operation The operation to apply
     * @return The updated document
     */
    function applyOperation<T>(document: T, operation: Operation): T;
    /**
     * Apply a single JSON Patch Operation on a JSON document.
     * Returns the updated document.
     *
     * @param document The document to patch
     * @param operation The operation to apply
     * @param validate Whether to validate the operation
     * @param mutateDocument Whether to mutate the original document or clone it before applying
     * @return The updated document
     */
    function applyOperation<T>(document: T, operation: Operation, validate: boolean, mutateDocument: boolean): T;
    /**
     * Apply a JSON Patch on a JSON document.
     * Returns an array of results of operations.
     * Each element can either be a boolean (if op == 'test') or
     * the removed object (operations that remove things)
     * or just be undefined
     */
    function apply(document: any, patch: Operation[], validate?: boolean): any[];
    class JsonPatchError extends Error {
        message: string;
        name: JsonPatchErrorName;
        index: number;
        operation: any;
        tree: any;
        constructor(message: string, name: JsonPatchErrorName, index?: number, operation?: any, tree?: any);
    }
    /**
     * Validates a single operation. Called from `jsonpatch.validate`. Throws `JsonPatchError` in case of an error.
     * @param {object} operation - operation object (patch)
     * @param {number} index - index of operation in the sequence
     * @param {object} [tree] - object where the operation is supposed to be applied
     * @param {string} [existingPathFragment] - comes along with `tree`
     */
    function validator(operation: Operation, index: number, document?: any, existingPathFragment?: string): void;
    /**
     * Validates a sequence of operations. If `operation` parameter is provided, the sequence is additionally validated against the object tree.
     * If error is encountered, returns a JsonPatchError object
     * @param patch
     * @param document
     * @returns {JsonPatchError|undefined}
     */
    function validate(patch: Operation[], document?: any): JsonPatchError | undefined;
}
export default jsonpatch;
