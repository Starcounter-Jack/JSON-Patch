/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * (c) 2017 Joachim Wester
 * MIT license
 */
export declare function hasOwnProperty(obj: any, key: any): any;
export declare function _objectKeys(obj: any): any[];
/**
* Deeply clone the object.
* https://jsperf.com/deep-copy-vs-json-stringify-json-parse/25 (recursiveDeepCopy)
* @param  {any} obj value to clone
* @return {any} cloned obj
*/
export declare function _deepClone(obj: any): any;
export declare function isInteger(str: string): boolean;
/**
* Escapes a json pointer path
* @param path The raw pointer
* @return the Escaped path
*/
export declare function escapePathComponent(path: string): string;
/**
 * Unescapes a json pointer path
 * @param path The escaped pointer
 * @return The unescaped path
 */
export declare function unescapePathComponent(path: string): string;
export declare function _getPathRecursive(root: Object, obj: Object): string;
export declare function getPath(root: Object, obj: Object): string;
/**
* Recursively checks whether an object has any undefined values inside.
*/
export declare function hasUndefined(obj: any): boolean;
export declare type JsonPatchErrorName = 'SEQUENCE_NOT_AN_ARRAY' | 'OPERATION_NOT_AN_OBJECT' | 'OPERATION_OP_INVALID' | 'OPERATION_X_ARGS_NOT_ARRAY' | 'OPERATION_X_OP_INVALID' | 'OPERATION_X_CONFIG_INVALID' | 'OPERATION_X_ID_INVALID' | 'OPERATION_X_AMBIGUOUS_REMOVAL' | 'OPERATION_X_OPERATOR_EXCEPTION' | 'OPERATION_PATH_INVALID' | 'OPERATION_FROM_REQUIRED' | 'OPERATION_VALUE_REQUIRED' | 'OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED' | 'OPERATION_PATH_CANNOT_ADD' | 'OPERATION_PATH_UNRESOLVABLE' | 'OPERATION_FROM_UNRESOLVABLE' | 'OPERATION_PATH_ILLEGAL_ARRAY_INDEX' | 'OPERATION_VALUE_OUT_OF_BOUNDS' | 'TEST_OPERATION_FAILED';
export declare class PatchError extends Error {
    name: JsonPatchErrorName;
    index?: number;
    operation?: any;
    tree?: any;
    constructor(message: string, name: JsonPatchErrorName, index?: number, operation?: any, tree?: any);
}
export declare const PROTO_ERROR_MSG = "JSON-Patch: modifying `__proto__` or `constructor/prototype` prop is banned for security reasons, if this was on purpose, please set `banPrototypeModifications` flag false and pass it to this function. More info in fast-json-patch README";
export declare function isValidExtendedOpId(xid: string): boolean;
declare type KeyType = string | number;
interface PruneComponents {
    modType: 'prune';
    comps: Array<KeyType>;
}
interface GraftComponents {
    modType: 'graft';
    comps: Array<KeyType>;
}
export declare type PathComponents = PruneComponents | GraftComponents;
/**
 * attach/remove source tree to/from target tree at appropriate path.
 * modifies targetObj (in place) by reference.
 *
 * This is necessary to deal with JS "by value" semantics
 */
export declare function _graftTree(sourceObj: any, targetObj: any, pathComponents: PathComponents): void;
export {};
