/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * json-patch-duplex.js version: 1.1.10
 * (c) 2013 Joachim Wester
 * MIT license
 */

namespace jsonpatch {
  export type Operation = AddOperation<any> | RemoveOperation | ReplaceOperation<any> | MoveOperation | CopyOperation | TestOperation<any>;

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
      case 'undefined': //backward compatibility, but really I think we should return false
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
            if (!_equals(a[i], b[i])) return false;

          return true;
        }

        var bKeys = _objectKeys(b);
        var bLength = bKeys.length;
        if (_objectKeys(a).length !== bLength)
          return false;

        for (var i = 0; i < bLength; i++)
          if (!_equals(a[i], b[i])) return false;

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
  var objOps = {
    add: function (obj, key) {
      obj[key] = this.value;
    },
    remove: function (obj, key) {
      var removed = obj[key];
      delete obj[key];
      return removed;
    },
    replace: function (obj, key) {
      var removed = obj[key];
      obj[key] = this.value;
      return removed;
    },
    move: function (obj, key, tree) {
      var getOriginalDestination: any = { op: "_get", path: this.path };
      apply(tree, [getOriginalDestination]);
      // In case value is moved up and overwrites its ancestor
      var original = getOriginalDestination.value === undefined ?
        undefined : JSON.parse(JSON.stringify(getOriginalDestination.value));

      var temp: any = { op: "_get", path: this.from };
      apply(tree, [temp]);

      apply(tree, [
        { op: "remove", path: this.from }
      ]);
      apply(tree, [
        { op: "add", path: this.path, value: temp.value }
      ]);
      return original;
    },
    copy: function (obj, key, tree) {
      var temp: any = { op: "_get", path: this.from };
      apply(tree, [temp]);
      apply(tree, [
        { op: "add", path: this.path, value: temp.value }
      ]);
    },
    test: function (obj, key) {
      return _equals(obj[key], this.value);
    },
    _get: function (obj, key) {
      this.value = obj[key];
    }
  };

  /* The operations applicable to an array. Many are the same as for the object */
  var arrOps = {
    add: function (arr, i) {
      arr.splice(i, 0, this.value);
      // this may be needed when using '-' in an array
      return i;
    },
    remove: function (arr, i) {
      var removedList = arr.splice(i, 1);
      return removedList[0];
    },
    replace: function (arr, i) {
      var removed = arr[i];
      arr[i] = this.value;
      return removed;
    },
    move: objOps.move,
    copy: objOps.copy,
    test: objOps.test,
    _get: objOps._get
  };

  /* The operations applicable to object root. Many are the same as for the object */
  var rootOps = {
    add: function (obj) {
      rootOps.remove.call(this, obj);
      for (var key in this.value) {
        if (this.value.hasOwnProperty(key)) {
          obj[key] = this.value[key];
        }
      }
    },
    remove: function (obj) {
      var removed = {};
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          removed[key] = obj[key];
          objOps.remove.call(this, obj, key);
        }
      }
      return removed;
    },
    replace: function (obj) {
      var removed = apply(obj, [
        { op: "remove", path: this.path }
      ]);
      apply(obj, [
        { op: "add", path: this.path, value: this.value }
      ]);
      return removed[0];
    },
    move: objOps.move,
    copy: objOps.copy,
    test: function (obj) {
      return (JSON.stringify(obj) === JSON.stringify(this.value));
    },
    _get: function (obj) {
      this.value = obj;
    }
  };

  var _isArray;
  if (Array.isArray) { //standards; http://jsperf.com/isarray-shim/4
    _isArray = Array.isArray;
  }
  else { //IE8 shim
    _isArray = function (obj: any) {
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
   * Apply a single JSON Patch Operation on a JSON document.
   * Returns the updated document.
   * Suitable as a reducer.
   * 
   * @param document The document to patch
   * @param operation The operation to apply
   * @return The updated document
   */
  export function applyOperation<T>(document: T, operation: Operation): T;
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
  export function applyOperation<T>(document: T, operation: Operation, validate: boolean, mutateDocument: boolean): T;
  export function applyOperation<T>(document: T, operation: Operation, validate = false, mutateDocument = true): T {
    if (typeof validate !== 'boolean') { // if validate is not a boolean, it's being called from `reduce`
      validate = false;
      mutateDocument = true;
    }
    // on root
    if (operation.path === "") {
      if (operation.op === 'add' || operation.op === 'replace') {// same for add or replace 
        return operation.value;
      } else if (operation.op === 'move' || operation.op === 'copy') { // it's a move or copy to root
        // get the value by json-pointer in `from` field
        const temp: any = { op: "_get", path: operation.from };
        apply(document, [temp]);
        return temp.value;
      } else { // it's a remove or test on root
        if (operation.op === 'test') {
          if(_equals(document, operation.value)) {
            return document;
          } else {
            throw new JsonPatchError('Test operation failed', 'TEST_OPERATION_FAILED', 0, operation, document);
          }
        } else if(operation.op === 'remove')  { // a remove on root
          return null;
        } else { /* bad operation */
          if(validate) {
              throw new JsonPatchError('Operation `op` property is not one of operations defined in RFC-6902', 'OPERATION_OP_INVALID', 0, operation, document);
          } else {
            return document;
          }
        }
      }
    } else {  // test operation 
      if (operation.op === 'test') {
        const results = apply(document, [operation], validate);
        if(results[0]) {
          return document;
        } else {
          throw new JsonPatchError('Test operation failed', 'TEST_OPERATION_FAILED', 0, operation, document);
        }
      }
      else {
        if(typeof document === 'object' && document !== null) {          
          !mutateDocument && (document = deepClone(document)); // keep the original tree untouched
          apply(document, [operation], validate);
          return document;
        } else { // tree is a primitive or null;
          return document;
        }       
      }
    }
  }
  /**
   * Apply a JSON Patch on a JSON document.
   * Returns an array of results of operations.
   * Each element can either be a boolean (if op == 'test') or
   * the removed object (operations that remove things)
   * or just be undefined
   */
  export function apply(document: any, patch: Operation[], validate?: boolean): any[] {
    const results = new Array(patch.length);
    let p = 0;
    let plen = patch.length;
    let operation: Operation;
    let key: string | number;
    while (p < plen) {
      operation = patch[p];
      p++;
      // Find the object
      var path = operation.path || "";
      var keys = path.split('/');
      var obj = document;
      var t = 1; //skip empty element - http://jsperf.com/to-shift-or-not-to-shift
      var len = keys.length;
      var existingPathFragment = undefined;

      while (true) {
        key = keys[t];

        if (validate) {
          if (existingPathFragment === undefined) {
            if (obj[key] === undefined) {
              existingPathFragment = keys.slice(0, t).join('/');
            }
            else if (t == len - 1) {
              existingPathFragment = operation.path;
            }
            if (existingPathFragment !== undefined) {
              this.validator(operation, p - 1, document, existingPathFragment);
            }
          }
        }

        t++;
        if (key === undefined) { //is root
          if (t >= len) {
            results[p - 1] = rootOps[operation.op].call(operation, obj, key, document); // Apply patch
            break;
          }
        }
        if (_isArray(obj)) {
          if (key === '-') {
            key = obj.length;
          }
          else {
            if (validate && !isInteger(key)) {
              throw new JsonPatchError("Expected an unsigned base-10 integer value, making the new referenced value the array element with the zero-based index", "OPERATION_PATH_ILLEGAL_ARRAY_INDEX", p - 1, operation.path, operation);
            }
            key = parseInt(key, 10);
          }
          if (t >= len) {
            if (validate && operation.op === "add" && key > obj.length) {
              throw new JsonPatchError("The specified index MUST NOT be greater than the number of elements in the array", "OPERATION_VALUE_OUT_OF_BOUNDS", p - 1, operation.path, operation);
            }
            results[p - 1] = arrOps[operation.op].call(operation, obj, key, document); // Apply patch
            break;
          }
        }
        else {
          if (key && key.indexOf('~') != -1)
            key = key.replace(/~1/g, '/').replace(/~0/g, '~'); // escape chars
          if (t >= len) {
            results[p - 1] = objOps[operation.op].call(operation, obj, key, document); // Apply patch
            break;
          }
        }
        obj = obj[key];
      }
    }
    return results;
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
   * @param {object} [tree] - object where the operation is supposed to be applied
   * @param {string} [existingPathFragment] - comes along with `tree`
   */
  export function validator(operation: Operation, index: number, document?: any, existingPathFragment?: string): void {
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
      // paths that aren't emptystring should start with "/"
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
        var error = jsonpatch.validate([existingValue], document);
        if (error && error.name === 'OPERATION_PATH_UNRESOLVABLE') {
          throw new JsonPatchError('Cannot perform the operation from a path that does not exist', 'OPERATION_FROM_UNRESOLVABLE', index, operation, document);
        }
      }
    }
  }

  /**
   * Validates a sequence of operations. If `operation` parameter is provided, the sequence is additionally validated against the object tree.
   * If error is encountered, returns a JsonPatchError object
   * @param patch
   * @param document
   * @returns {JsonPatchError|undefined}
   */
  export function validate(patch: Operation[], document?: any): JsonPatchError | undefined {
    try {
      if (!_isArray(patch)) {
        throw new JsonPatchError('Patch sequence must be an array', 'SEQUENCE_NOT_AN_ARRAY');
      }

      if (document) {
        document = JSON.parse(JSON.stringify(document)); //clone tree so that we can safely try applying operations
        apply.call(this, document, patch, true);
      }
      else {
        for (var i = 0; i < patch.length; i++) {
          this.validator(patch[i], i);
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
  exports.validate = jsonpatch.validate;
  exports.applyOperation = jsonpatch.applyOperation;
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
some of them. Here is super light wieght fix.
*/
if (isBrowser) {
  exports = undefined
}
