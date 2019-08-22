/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * (c) 2017 Joachim Wester
 * MIT license
 */
import { _deepClone, escapePathComponent } from './helpers.js';
import { applyPatch, Operation } from './core.js';
export interface Observer<T> {
    object: T;
    patches: Operation[];
    unobserve: () => void;
    callback: (patches: Operation[]) => void;
}
/**
 * Detach an observer from an object
 */
export declare function unobserve<T>(root: T, observer: Observer<T>): void;
/**
 * Observes changes made to an object, which can then be retrieved using generate
 */
export declare function observe<T>(obj: Object | Array<T>, callback?: (patches: Operation[]) => void): Observer<T>;
/**
 * Generate an array of patches from an observer
 */
export declare function generate<T>(observer: Observer<Object>, invertible?: boolean): Operation[];
/**
 * Create an array of patches from the differences in two objects
 */
export declare function compare(tree1: Object | Array<any>, tree2: Object | Array<any>, invertible?: boolean): Operation[];
/**
 * Default export for backwards compat
 */
import * as core from './core.js';
import { PatchError as JsonPatchError, unescapePathComponent } from './helpers.js';
declare const _default: {
    unobserve: typeof unobserve;
    observe: typeof observe;
    generate: typeof generate;
    compare: typeof compare;
    JsonPatchError: typeof JsonPatchError;
    deepClone: typeof _deepClone;
    escapePathComponent: typeof escapePathComponent;
    unescapePathComponent: typeof unescapePathComponent;
    getValueByPointer(document: any, pointer: string): any;
    applyOperation<T>(document: T, operation: Operation, validateOperation?: boolean | core.Validator<T>, mutateDocument?: boolean, banPrototypeModifications?: boolean, index?: number): core.OperationResult<T>;
    applyPatch<T>(document: T, patch: Operation[], validateOperation?: boolean | core.Validator<T>, mutateDocument?: boolean, banPrototypeModifications?: boolean): core.PatchResult<T>;
    applyReducer<T>(document: T, operation: Operation, index: number): T;
    validator(operation: Operation, index: number, document?: any, existingPathFragment?: string): void;
    validate<T>(sequence: Operation[], document?: T, externalValidator?: core.Validator<T>): JsonPatchError;
    _areEquals(a: any, b: any): boolean;
    default: {
        JsonPatchError: typeof JsonPatchError;
        deepClone: typeof _deepClone;
        getValueByPointer: typeof core.getValueByPointer;
        applyOperation: typeof core.applyOperation;
        applyPatch: typeof applyPatch;
        applyReducer: typeof core.applyReducer;
        validator: typeof core.validator;
        validate: typeof core.validate;
        _areEquals: typeof core._areEquals;
    };
};
export default _default;
