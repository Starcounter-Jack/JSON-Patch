/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * json-patch-duplex.js version: 1.1.10
 * (c) 2013 Joachim Wester
 * MIT license
 */

namespace jsonpatch {
  export type Operation = AddOperation<any> | RemoveOperation | ReplaceOperation<any> | MoveOperation | CopyOperation | TestOperation<any> | GetOperation<any>;

  export interface Validator<T> {
    (operation: Operation, index: number, document: T, existingPathFragment: string): void;
  }

  export interface OperationResult<T> {
    removed?: any,
    test?: boolean,
    newDocument: T;
  }

  export interface BaseOperation {
    path: string;
  }

  export interface AddOperation<T> extends BaseOperation {
    op: 'add';
    value: T;
  }

  export interface RemoveOperation extends BaseOperation {
    op: 'remove';
  }

  export interface ReplaceOperation<T> extends BaseOperation {
    op: 'replace';
    value: T;
  }

  export interface MoveOperation extends BaseOperation {
    op: 'move';
    from: string;
  }

  export interface CopyOperation extends BaseOperation {
    op: 'copy';
    from: string;
  }

  export interface TestOperation<T> extends BaseOperation {
    op: 'test';
    value: T;
  }
  export interface GetOperation<T> extends BaseOperation {
    op: '_get';
    value: T;
  }
  export interface PatchResult<T> extends Array<OperationResult<T>> {
    newDocument: T;
  }

  // Aliases for BC

  /** DEPRECATED. Use `Operation` */
  export type Patch<T> = Operation;
  /** DEPRECATED. Use `AddOperation` */
  export type AddPatch<T> = AddOperation<T>;
  /** DEPRECATED. Use `RemoveOperation` */
  export type RemovePatch = RemoveOperation;
  /** DEPRECATED. Use `ReplaceOperation` */
  export type ReplacePatch<T> = ReplaceOperation<T>;
  /** DEPRECATED. Use `MoveOperation` */
  export type MovePatch = MoveOperation;
  /** DEPRECATED. Use `CopyOperation` */
  export type CopyPatch = CopyOperation;
  /** DEPRECATED. Use `TestOperation` */
  export type TestPatch<T> = TestOperation<T>;

  export type JsonPatchErrorName = 'SEQUENCE_NOT_AN_ARRAY' |
    'OPERATION_NOT_AN_OBJECT' |
    'OPERATION_OP_INVALID' |
    'OPERATION_PATH_INVALID' |
    'OPERATION_FROM_REQUIRED' |
    'OPERATION_VALUE_REQUIRED' |
    'OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED' |
    'OPERATION_PATH_CANNOT_ADD' |
    'OPERATION_PATH_UNRESOLVABLE' |
    'OPERATION_FROM_UNRESOLVABLE' |
    'OPERATION_PATH_ILLEGAL_ARRAY_INDEX' |
    'OPERATION_VALUE_OUT_OF_BOUNDS' |
    'TEST_OPERATION_FAILED';

  var _objectKeys = function (obj) {
    if (_isArray(obj)) {
      var keys = new Array(obj.length);

      for (var k = 0; k < keys.length; k++) {
        keys[k] = "" + k;
      }

      return keys;
    }

    if (Object.keys) {
      return Object.keys(obj);
    }

    var keys = [];
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        keys.push(i);
      }
    }
    return keys;
  };

  function _equals(a, b) {
    switch (typeof a) {
      case 'undefined':
      case 'boolean':
      case 'string':
      case 'number':
        return a === b;
      case 'object':
        if (a === null)
          return b === null;
        if (_isArray(a)) {
          if (!_isArray(b) || a.length !== b.length)
            return false;
          for (var i = 0, l = a.length; i < l; i++)
            if (!_equals(a[i], b[i])) {
              return false;
            }
          return true;
        }
        const aKeys = _objectKeys(a);
        const bKeys = _objectKeys(b);

        for (let i = 0; i < aKeys.length; i++) {
          const key = aKeys[i];
          // check all properties of `a` to equal their `b` counterpart
          if (!_equals(a[key], b[key])) {
            return false;
          }
          // remove the key from consideration in next step since we know it's "equal"
          const bKeysIdx = bKeys.indexOf(key);
          if (bKeysIdx >= 0) {
            bKeys.splice(bKeysIdx, 1);
          }
        }
        for (let i = 0; i < bKeys.length; i++) {
          var key = bKeys[i];
          // lastly, test any untested properties of `b`
          if (!_equals(a[key], b[key])) {
            return false;
          }
        }

        return true;
      default:
        return false;
    }
  }
  function deepClone(obj: any) {
    switch (typeof obj) {
      case "object":
        return JSON.parse(JSON.stringify(obj)); //Faster than ES5 clone - http://jsperf.com/deep-cloning-of-objects/5

      case "undefined":
        return null; //this is how JSON.stringify behaves for array items

      default:
        return obj; //no need to clone primitives
    }
  }
  /* We use a Javascript hash to store each
   function. Each hash entry (property) uses
   the operation identifiers specified in rfc6902.
   In this way, we can map each patch operation
   to its dedicated function in efficient way.
   */

  /* The operations applicable to an object */
  const objOps = {
    add: function (obj, key, document) {
      obj[key] = this.value;
      return {newDocument: document};
    },
    remove: function (obj, key, document) {
      var removed = obj[key];
      delete obj[key];
      return {newDocument: document, removed}
    },
    replace: function (obj, key, document) {
      var removed = obj[key];
      obj[key] = this.value;
      return {newDocument: document, removed};
    },
    move: function (obj, key, document) {
      /* in case move target overwrites an existing value, 
      return the removed value, this can be taxing performance-wise,
      and is potentially unneeded */
      
      let removed = getValueByPointer(document, this.path);

      if(removed) {
          removed = deepClone(removed);
      }

      const originalValue = applyOperation(document,
        { op: "remove", path: this.from }
      ).removed;

      applyOperation(document,
        { op: "add", path: this.path, value: originalValue }
      );

      return {newDocument: document, removed};
    },
    copy: function (obj, key, document) {
      const valueToCopy = getValueByPointer(document, this.from);
      applyOperation(document,
        { op: "add", path: this.path, value: valueToCopy }
      );
      return {newDocument: document}
    },
    test: function (obj, key, document) {
      return {newDocument: document, test: _equals(obj[key], this.value)}
    },
    _get: function (obj, key, document) {
      this.value = obj[key];
      return {newDocument: document}
    }
  };

  /* The operations applicable to an array. Many are the same as for the object */
  var arrOps = {
    add: function (arr, i, document) {
      arr.splice(i, 0, this.value);
      // this may be needed when using '-' in an array
      return {newDocument: document, index: i}
    },
    remove: function (arr, i, document) {
      var removedList = arr.splice(i, 1);
      return {newDocument: document, removed: removedList[0]};
    },
    replace: function (arr, i, document) {
      var removed = arr[i];
      arr[i] = this.value;
      return {newDocument: document, removed};
    },
    move: objOps.move,
    copy: objOps.copy,
    test: objOps.test,
    _get: objOps._get
  };

  var _isArray: (obj: any) => obj is any[];
  if (Array.isArray) { //standards; http://jsperf.com/isarray-shim/4
    _isArray = Array.isArray;
  }
  else { //IE8 shim
    _isArray = function (obj: any): obj is any[] {
      return obj.push && typeof obj.length === 'number';
    }
  }

  //3x faster than cached /^\d+$/.test(str)
  function isInteger(str: string): boolean {
    var i = 0;
    var len = str.length;
    var charCode;
    while (i < len) {
      charCode = str.charCodeAt(i);
      if (charCode >= 48 && charCode <= 57) {
        i++;
        continue;
      }
      return false;
    }
    return true;
  }





  /**
  * Escapes a json pointer path
  * @param path The raw pointer
  * @return the Escaped path
  */
  export function escapePathComponent(path: string): string {
    if (path.indexOf('/') === -1 && path.indexOf('~') === -1) return path;
    return path.replace(/~/g, '~0').replace(/\//g, '~1');
  }
  /**
   * Unescapes a json pointer path
   * @param path The escaped pointer
   * @return The unescaped path
   */
  export function unescapePathComponent(path: string): string {
    return path.replace(/~1/g, '/').replace(/~0/g, '~');
  }

  /**
   * Retrieves a value from a JSON document by a JSON pointer.
   * Returns the value.
   *
   * @param document The document to get the value from
   * @param pointer an escaped JSON pointer
   * @return The retrieved value
   */
  export function getValueByPointer(document: any, pointer: string): any {
    var getOriginalDestination = <GetOperation<any>>{ op: "_get", path: pointer };
    applyOperation(document, getOriginalDestination);
    return getOriginalDestination.value;
  }
  /**
   * Apply a single JSON Patch Operation on a JSON document.
   * Returns the {newDocument, result} of the operation.
   *
   * @param document The document to patch
   * @param operation The operation to apply
   * @param validateOperation `false` is without validation, `true` to use default jsonpatch's validation, or you can pass a `validateOperation` callback to be used for validation.
   * @param mutateDocument Whether to mutate the original document or clone it before applying
   * @return `{newDocument, result}` after the operation
   */
  export function applyOperation<T>(document: T, operation: Operation, validateOperation: boolean | Validator<T> = false, mutateDocument: boolean = true): OperationResult<T> {
    if (validateOperation) {
      if (typeof validateOperation == 'function') {
        validateOperation(operation, 0, document, operation.path);
      }
      else {
        validator(operation, 0);
      }
    }
    /* ROOT OPERATIONS */
    if (operation.path === "") {
      let returnValue: OperationResult<T> = { newDocument: document };
      if (operation.op === 'add') {
        returnValue.newDocument = operation.value;
        return returnValue;
      } else if (operation.op === 'replace') {
        returnValue.newDocument = operation.value;
        returnValue.removed = document; //document we removed
        return returnValue;
      }
      else if (operation.op === 'move' || operation.op === 'copy') { // it's a move or copy to root
        returnValue.newDocument = getValueByPointer(document, operation.from); // get the value by json-pointer in `from` field
        if (operation.op === 'move') { // report removed item
          returnValue.removed = document;
        }
        return returnValue;
      } else if (operation.op === 'test') {
        returnValue.test = _equals(document, operation.value);
        if (returnValue.test === false) {
          throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', 0, operation, document);
        }
        returnValue.newDocument = document;
        return returnValue;
      } else if (operation.op === 'remove') { // a remove on root
        returnValue.removed = document;
        returnValue.newDocument = null;
        return returnValue;
      } else { /* bad operation */
        if (validateOperation) {
          throw new JsonPatchError('Operation `op` property is not one of operations defined in RFC-6902', 'OPERATION_OP_INVALID', 0, operation, document);
        } else {
          return returnValue;
        }
      }
    } /* END ROOT OPERATIONS */
    else {
      if (!mutateDocument) {
        document = deepClone(document);
      }
      const path = operation.path || "";
      const keys = path.split('/');
      let obj = document;
      let t = 1; //skip empty element - http://jsperf.com/to-shift-or-not-to-shift
      let len = keys.length;
      let existingPathFragment = undefined;
      let key: string | number;
      let validateFunction;
      if (typeof validateOperation == 'function') {
        validateFunction = validateOperation;
      }
      else {
        validateFunction = validator;
      }
      while (true) {
        key = keys[t];

        if (validateOperation) {
          if (existingPathFragment === undefined) {
            if (obj[key] === undefined) {
              existingPathFragment = keys.slice(0, t).join('/');
            }
            else if (t == len - 1) {
              existingPathFragment = operation.path;
            }
            if (existingPathFragment !== undefined) {
              validateFunction(operation, 0, document, existingPathFragment);
            }
          }
        }
        t++;
        if (_isArray(obj)) {
          if (key === '-') {
            key = obj.length;
          }
          else {
            if (validateOperation && !isInteger(key)) {
              throw new JsonPatchError("Expected an unsigned base-10 integer value, making the new referenced value the array element with the zero-based index", "OPERATION_PATH_ILLEGAL_ARRAY_INDEX", 0, operation.path, operation);
            }
            key = ~~key;
          }
          if (t >= len) {
            if (validateOperation && operation.op === "add" && key > obj.length) {
              throw new JsonPatchError("The specified index MUST NOT be greater than the number of elements in the array", "OPERATION_VALUE_OUT_OF_BOUNDS", 0, operation.path, operation);
            }
            const returnValue = arrOps[operation.op].call(operation, obj, key, document); // Apply patch
            if (returnValue.test === false) {
              throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', 0, operation, document);
            }            
            return returnValue;
          }
        }
        else {
          if (key && key.indexOf('~') != -1) {
            key = unescapePathComponent(key);
          }
          if (t >= len) {
            const returnValue = objOps[operation.op].call(operation, obj, key, document); // Apply patch
            if (returnValue.test === false) {
              throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', 0, operation, document);
            }            
            return returnValue;
          }
        }
        obj = obj[key];
      }
    }
  }

  /**
   * Apply a full JSON Patch array on a JSON document.
   * Returns the {newDocument, result} of the patch.
   *
   * @param document The document to patch
   * @param patch The patch to apply
   * @param validateOperation `false` is without validation, `true` to use default jsonpatch's validation, or you can pass a `validateOperation` callback to be used for validation.
   * @return An array of `{newDocument, result}` after the patch, with a `newDocument` property for accessing the final state with ease.
   */
  export function applyPatch<T>(document: T, patch: Operation[], validateOperation?: boolean | Validator<T>): PatchResult<T> {
    const results = new Array(patch.length) as PatchResult<T>;

    for (let i = 0, length = patch.length; i < length; i++) {
      results[i] = applyOperation(document, patch[i], validateOperation);
      document = results[i].newDocument; // in case root was replaced
    }
    results.newDocument = document;
    return results;
  }

  /**
   * Apply a JSON Patch on a JSON document.
   * Returns an array of results of operations.
   * Each element can either be a boolean (if op == 'test') or
   * the removed object (operations that remove things)
   * or just be undefined
   * @deprecated
   */
  export function apply<T>(document: T, patch: Operation[], validateOperation?: boolean | Validator<T>): any[] {
    console.warn('jsonpatch.apply is deprecated, please use `applyPatch` for applying patch sequences, or `applyOperation` to apply individual operations.');
    const results = new Array(patch.length);

    /* this code might be overkill, but will be removed soon, it is to prevent the breaking change of root operations */
    for (let i = 0, length = patch.length; i < length; i++) {

      if (patch[i].path == "" && patch[i].op != "remove" && patch[i].op != "test") {
        let value;

        if (patch[i].op == "replace" || patch[i].op == "move") {
          results[i] = deepClone(document);
        }

        if (patch[i].op == "copy" || patch[i].op == "move") {
          value = getValueByPointer(document, (<any>patch[i]).from);
        }
        if (patch[i].op == "replace" || patch[i].op == "add") {
          value = (<any>patch[i]).value;
        }

        // empty the object
        Object.keys(document).forEach(key => delete document[key]);

        //copy everything from value
        Object.keys(value).forEach(key => document[key] = value[key]);

      }
      else {
        results[i] = applyOperation(document, patch[i], validateOperation);
        results[i] = results[i].removed || results[i].test;
      }
    }
    return results;
  }

  /**
   * Apply a single JSON Patch Operation on a JSON document.
   * Returns the updated document.
   * Suitable as a reducer.
   *
   * @param document The document to patch
   * @param operation The operation to apply
   * @return The updated document
   */
  export function applyReducer<T>(document: T, operation: Operation): T {
    const operationResult: OperationResult<T> = applyOperation(document, operation)
    if (operationResult.test === false) { // failed test
      throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', 0, operation, document);
    }
    return operationResult.newDocument;
  }



  // provide scoped __extends for TypeScript's `extend` keyword so it will not provide global one during compilation
  function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }

  export class JsonPatchError extends Error {

    constructor(public message: string, public name: JsonPatchErrorName, public index?: number, public operation?: any, public tree?: any) {
      super(message);
    }
  }

  /**
   * Recursively checks whether an object has any undefined values inside.
   */
  function hasUndefined(obj: any): boolean {
    if (obj === undefined) {
      return true;
    }
    if (obj) {
      if (_isArray(obj)) {
        for (var i = 0, len = obj.length; i < len; i++) {
          if (hasUndefined(obj[i])) {
            return true;
          }
        }
      }
      else if (typeof obj === "object") {
        var objKeys = _objectKeys(obj);
        var objKeysLength = objKeys.length;
        for (var i = 0; i < objKeysLength; i++) {
          if (hasUndefined(obj[objKeys[i]])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Validates a single operation. Called from `jsonpatch.validate`. Throws `JsonPatchError` in case of an error.
   * @param {object} operation - operation object (patch)
   * @param {number} index - index of operation in the sequence
   * @param {object} [document] - object where the operation is supposed to be applied
   * @param {string} [existingPathFragment] - comes along with `document`
   */
  export function validator(operation: Patch<any>, index: number, document?: any, existingPathFragment?: string): void {
    if (typeof operation !== 'object' || operation === null || _isArray(operation)) {
      throw new JsonPatchError('Operation is not an object', 'OPERATION_NOT_AN_OBJECT', index, operation, document);
    }

    else if (!objOps[operation.op]) {
      throw new JsonPatchError('Operation `op` property is not one of operations defined in RFC-6902', 'OPERATION_OP_INVALID', index, operation, document);
    }

    else if (typeof operation.path !== 'string') {
      throw new JsonPatchError('Operation `path` property is not a string', 'OPERATION_PATH_INVALID', index, operation, document);
    }

    else if (operation.path.indexOf('/') !== 0 && operation.path.length > 0) {
      // paths that aren't empty string should start with "/"
      throw new JsonPatchError('Operation `path` property must start with "/"', 'OPERATION_PATH_INVALID', index, operation, document);
    }

    else if ((operation.op === 'move' || operation.op === 'copy') && typeof operation.from !== 'string') {
      throw new JsonPatchError('Operation `from` property is not present (applicable in `move` and `copy` operations)', 'OPERATION_FROM_REQUIRED', index, operation, document);
    }

    else if ((operation.op === 'add' || operation.op === 'replace' || operation.op === 'test') && operation.value === undefined) {
      throw new JsonPatchError('Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)', 'OPERATION_VALUE_REQUIRED', index, operation, document);
    }

    else if ((operation.op === 'add' || operation.op === 'replace' || operation.op === 'test') && hasUndefined(operation.value)) {
      throw new JsonPatchError('Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)', 'OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED', index, operation, document);
    }

    else if (document) {
      if (operation.op == "add") {
        var pathLen = operation.path.split("/").length;
        var existingPathLen = existingPathFragment.split("/").length;
        if (pathLen !== existingPathLen + 1 && pathLen !== existingPathLen) {
          throw new JsonPatchError('Cannot perform an `add` operation at the desired path', 'OPERATION_PATH_CANNOT_ADD', index, operation, document);
        }
      }
      else if (operation.op === 'replace' || operation.op === 'remove' || (<any>operation.op) === '_get') {
        if (operation.path !== existingPathFragment) {
          throw new JsonPatchError('Cannot perform the operation at a path that does not exist', 'OPERATION_PATH_UNRESOLVABLE', index, operation, document);
        }
      }
      else if (operation.op === 'move' || operation.op === 'copy') {
        var existingValue: any = { op: "_get", path: operation.from, value: undefined };
        var error = validate([existingValue], document);
        if (error && error.name === 'OPERATION_PATH_UNRESOLVABLE') {
          throw new JsonPatchError('Cannot perform the operation from a path that does not exist', 'OPERATION_FROM_UNRESOLVABLE', index, operation, document);
        }
      }
    }
  }

  /**
   * Validates a sequence of operations. If `document` parameter is provided, the sequence is additionally validated against the object document.
   * If error is encountered, returns a JsonPatchError object
   * @param sequence 
   * @param document
   * @returns {JsonPatchError|undefined}
   */
  export function validate<T>(sequence: Operation[], document?: T, externalValidator?: Validator<T>): JsonPatchError {
    try {
      if (!_isArray(sequence)) {
        throw new JsonPatchError('Patch sequence must be an array', 'SEQUENCE_NOT_AN_ARRAY');
      }
      if (document) {
        document = JSON.parse(JSON.stringify(document)); //clone document so that we can safely try applying operations
        applyPatch(document, sequence, externalValidator || true);
      }
      else {
        externalValidator = externalValidator || validator;
        for (var i = 0; i < sequence.length; i++) {
          externalValidator(sequence[i], i, document, undefined);
        }
      }
    }
    catch (e) {
      if (e instanceof JsonPatchError) {
        return e;
      }
      else {
        throw e;
      }
    }
  }
}

if (typeof exports !== "undefined") {
  exports.apply = jsonpatch.apply;
  exports.applyPatch = jsonpatch.applyPatch;
  exports.applyOperation = jsonpatch.applyOperation;
  exports.applyReducer = jsonpatch.applyReducer;
  exports.getValueByPointer = jsonpatch.getValueByPointer;
  exports.escapePathComponent = jsonpatch.escapePathComponent;
  exports.unescapePathComponent = jsonpatch.unescapePathComponent;
  exports.validate = jsonpatch.validate;
  exports.validator = jsonpatch.validator;
  exports.JsonPatchError = jsonpatch.JsonPatchError;
}
else {
  var exports: any = {};
  var isBrowser = true;
}
export default jsonpatch;

/*
When in browser, setting `exports = {}`
fools other modules into thinking they're
running in a node environment, which breaks
some of them. Here is super light weight fix.
*/
if (isBrowser) {
  exports = undefined
}
