/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * json-patch-duplex.js version: 1.1.10
 * (c) 2013 Joachim Wester
 * MIT license
 */

interface HTMLElement {
  attachEvent: Function;
  detachEvent: Function;
}

module jsonpatch {
  export type Patch<T> = AddPatch<T> | RemovePatch | ReplacePatch<T> | MovePatch | CopyPatch | TestPatch<T>;

  export interface PatchBase {
    path: string;
  }

  export interface AddPatch<T> extends PatchBase {
    op: 'add';
    value: T;
  }

  export interface RemovePatch extends PatchBase {
    op: 'remove';
  }

  export interface ReplacePatch<T> extends PatchBase {
    op: 'replace';
    value: T;
  }

  export interface MovePatch extends PatchBase {
    op: 'move';
    from: string;
  }

  export interface CopyPatch extends PatchBase {
    op: 'copy';
    from: string;
  }

  export interface TestPatch<T> extends PatchBase {
    op: 'test';
    value: T;
  }

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
    'OPERATION_VALUE_OUT_OF_BOUNDS';

  export interface Observer<T> {
    object: T;
    patches: Patch<any>[];
    unobserve: () => void;
    callback: (patches: Patch<any>[]) => void;
  }

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

  function escapePathComponent(str) {
    if (str.indexOf('/') === -1 && str.indexOf('~') === -1) return str;
    return str.replace(/~/g, '~0').replace(/\//g, '~1');
  }

  function _getPathRecursive(root: Object, obj: Object): string {
    var found;
    for (var key in root) {
      if (root.hasOwnProperty(key)) {
        if (root[key] === obj) {
          return escapePathComponent(key) + '/';
        }
        else if (typeof root[key] === 'object') {
          found = _getPathRecursive(root[key], obj);
          if (found != '') {
            return escapePathComponent(key) + '/' + found;
          }
        }
      }
    }
    return '';
  }

  function getPath(root: Object, obj: Object): string {
    if (root === obj) {
      return '/';
    }
    var path = _getPathRecursive(root, obj);
    if (path === '') {
      throw new Error("Object not found in root");
    }
    return '/' + path;
  }

  var beforeDict = [];

  class Mirror {
    obj: any;
    observers = [];

    constructor(obj: any) {
      this.obj = obj;
    }
  }

  class ObserverInfo {
    callback: any;
    observer: any;

    constructor(callback, observer) {
      this.callback = callback;
      this.observer = observer;
    }
  }

  function getMirror(obj: any): any {
    for (var i = 0, ilen = beforeDict.length; i < ilen; i++) {
      if (beforeDict[i].obj === obj) {
        return beforeDict[i];
      }
    }
  }

  function getObserverFromMirror(mirror: any, callback): any {
    for (var j = 0, jlen = mirror.observers.length; j < jlen; j++) {
      if (mirror.observers[j].callback === callback) {
        return mirror.observers[j].observer;
      }
    }
  }

  function removeObserverFromMirror(mirror: any, observer): any {
    for (var j = 0, jlen = mirror.observers.length; j < jlen; j++) {
      if (mirror.observers[j].observer === observer) {
        mirror.observers.splice(j, 1);
        return;
      }
    }
  }

  /**
   * Detach an observer from an object
   */
  export function unobserve<T>(root: T, observer: Observer<T>) {
    observer.unobserve();
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

  /**
   * Observes changes made to an object, which can then be retieved using generate
   */
  export function observe<T>(obj: any, callback?: (patches: Patch<any>[]) => void): Observer<T> {
    var patches = [];
    var root = obj;
    var observer;
    var mirror = getMirror(obj);

    if (!mirror) {
      mirror = new Mirror(obj);
      beforeDict.push(mirror);
    } else {
      observer = getObserverFromMirror(mirror, callback);
    }

    if (observer) {
      return observer;
    }

    observer = {};

    mirror.value = deepClone(obj);

    if (callback) {
      observer.callback = callback;
      observer.next = null;

      var dirtyCheck = () => {
        generate(observer);
      };
      var fastCheck = () => {
        clearTimeout(observer.next);
        observer.next = setTimeout(dirtyCheck);
      };
      if (typeof window !== 'undefined') { //not Node
        if (window.addEventListener) { //standards
          window.addEventListener('mouseup', fastCheck);
          window.addEventListener('keyup', fastCheck);
          window.addEventListener('mousedown', fastCheck);
          window.addEventListener('keydown', fastCheck);
          window.addEventListener('change', fastCheck);
        }
        else { //IE8
          (<any>document.documentElement).attachEvent('onmouseup', fastCheck);
          (<any>document.documentElement).attachEvent('onkeyup', fastCheck);
          (<any>document.documentElement).attachEvent('onmousedown', fastCheck);
          (<any>document.documentElement).attachEvent('onkeydown', fastCheck);
          (<any>document.documentElement).attachEvent('onchange', fastCheck);
        }
      }
    }
    observer.patches = patches;
    observer.object = obj;

    observer.unobserve = () => {
      generate(observer);
      clearTimeout(observer.next);
      removeObserverFromMirror(mirror, observer);

      if (typeof window !== 'undefined') {
        if (window.removeEventListener) {
          window.removeEventListener('mouseup', fastCheck);
          window.removeEventListener('keyup', fastCheck);
          window.removeEventListener('mousedown', fastCheck);
          window.removeEventListener('keydown', fastCheck);
        }
        else {
          (<any>document.documentElement).detachEvent('onmouseup', fastCheck);
          (<any>document.documentElement).detachEvent('onkeyup', fastCheck);
          (<any>document.documentElement).detachEvent('onmousedown', fastCheck);
          (<any>document.documentElement).detachEvent('onkeydown', fastCheck);
        }
      }
    };

    mirror.observers.push(new ObserverInfo(callback, observer));

    return observer;
  }

  /**
   * Generate an array of patches from an observer
   */
  export function generate<T>(observer: Observer<T>): Patch<any>[] {
    var mirror;
    for (var i = 0, ilen = beforeDict.length; i < ilen; i++) {
      if (beforeDict[i].obj === observer.object) {
        mirror = beforeDict[i];
        break;
      }
    }
    _generate(mirror.value, observer.object, observer.patches, "");
    if (observer.patches.length) {
      apply(mirror.value, observer.patches);
    }
    var temp = observer.patches;
    if (temp.length > 0) {
      observer.patches = [];
      if (observer.callback) {
        observer.callback(temp);
      }
    }
    return temp;
  }

  // Dirty check if obj is different from mirror, generate patches and update mirror
  function _generate(mirror, obj, patches, path) {
    if (obj === mirror) {
      return;
    }

    if (typeof obj.toJSON === "function") {
      obj = obj.toJSON();
    }

    var newKeys = _objectKeys(obj);
    var oldKeys = _objectKeys(mirror);
    var changed = false;
    var deleted = false;

    //if ever "move" operation is implemented here, make sure this test runs OK: "should not generate the same patch twice (move)"

    for (var t = oldKeys.length - 1; t >= 0; t--) {
      var key = oldKeys[t];
      var oldVal = mirror[key];
      if (obj.hasOwnProperty(key) && !(obj[key] === undefined && oldVal !== undefined && _isArray(obj) === false)) {
        var newVal = obj[key];
        if (typeof oldVal == "object" && oldVal != null && typeof newVal == "object" && newVal != null) {
          _generate(oldVal, newVal, patches, path + "/" + escapePathComponent(key));
        }
        else {
          if (oldVal !== newVal) {
            changed = true;
            patches.push({ op: "replace", path: path + "/" + escapePathComponent(key), value: deepClone(newVal) });
          }
        }
      }
      else {
        patches.push({ op: "remove", path: path + "/" + escapePathComponent(key) });
        deleted = true; // property has been deleted
      }
    }

    if (!deleted && newKeys.length == oldKeys.length) {
      return;
    }

    for (var t = 0; t < newKeys.length; t++) {
      var key = newKeys[t];
      if (!mirror.hasOwnProperty(key) && obj[key] !== undefined) {
        patches.push({ op: "add", path: path + "/" + escapePathComponent(key), value: deepClone(obj[key]) });
      }
    }
  }

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
   * Apply a single json-patch on an object tree
   * Returns the result object.
   */
  export function applyPatch(tree: any, patch: any, validate = false): any {
    if (validate && typeof tree !== 'object') {
      throw new TypeError('Tree has to be an object');
    }
    // on root
    if (patch.path === "") {
      if (patch.op === 'add' || patch.op === 'replace') {// same for add or replace 
        // a primitive value, just return it
        if (typeof patch.value !== 'object') {
          return patch.value;
        } else if (typeof patch.value === 'object') {
          // conflicting types [] vs {} just return the new value
          if (_isArray(tree) !== _isArray(patch.value)) {
            return patch.value;
            //same type, use original apply
          } else {
            apply(tree, [patch], validate);
            return tree;
          }
        }
      } else if (patch.op === 'move' || patch.op === 'copy') { // it's a move or copy to root
        // get the value by json-pointer in `from` field
        var temp: any = { op: "_get", path: patch.from };
        apply(tree, [temp]);
        // to cover conflicting types and primitive values 
        var newTree = applyPatch(tree, { op: 'replace', path: '', value: temp.value })
        return newTree;
      } else { // it's a remove or test on root
        if (patch.op === 'test') {
          return _equals(tree, patch.value);
        } else { // a remove on root
          return null;
        }
      }
    } else {  // test operation (even if not on root) needs to return a boolean
      if (patch.op === 'test') {
        var results = apply(tree, [patch], validate);
        return results[0];
      }
      else { // just use original apply and return
        apply(tree, [patch], validate);
        return tree;
      }

    }
  }
  
  /**
   * Apply a json-patch operation on an object tree
   * Returns an array of results of operations.
   * Each element can either be a boolean (if op == 'test') or
   * the removed object (operations that remove things)
   * or just be undefined
   */
  export function apply(tree: any, patches: Patch<any>[], validate?: boolean): any[] {
    var results = []
      , p = 0
      , plen = patches.length
      , patch
      , key;
    while (p < plen) {
      patch = patches[p];
      p++;
      // Find the object
      var path = patch.path || "";
      var keys = path.split('/');
      var obj = tree;
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
              existingPathFragment = patch.path;
            }
            if (existingPathFragment !== undefined) {
              this.validator(patch, p - 1, tree, existingPathFragment);
            }
          }
        }

        t++;
        if (key === undefined) { //is root
          if (t >= len) {
            results.push(rootOps[patch.op].call(patch, obj, key, tree)); // Apply patch
            break;
          }
        }
        if (_isArray(obj)) {
          if (key === '-') {
            key = obj.length;
          }
          else {
            if (validate && !isInteger(key)) {
              throw new JsonPatchError("Expected an unsigned base-10 integer value, making the new referenced value the array element with the zero-based index", "OPERATION_PATH_ILLEGAL_ARRAY_INDEX", p - 1, patch.path, patch);
            }
            key = parseInt(key, 10);
          }
          if (t >= len) {
            if (validate && patch.op === "add" && key > obj.length) {
              throw new JsonPatchError("The specified index MUST NOT be greater than the number of elements in the array", "OPERATION_VALUE_OUT_OF_BOUNDS", p - 1, patch.path, patch);
            }
            results.push(arrOps[patch.op].call(patch, obj, key, tree)); // Apply patch
            break;
          }
        }
        else {
          if (key && key.indexOf('~') != -1)
            key = key.replace(/~1/g, '/').replace(/~0/g, '~'); // escape chars
          if (t >= len) {
            results.push(objOps[patch.op].call(patch, obj, key, tree)); // Apply patch
            break;
          }
        }
        obj = obj[key];
      }
    }
    return results;
  }

  /**
   * Create an array of patches from the differences in two objects
   */
  export function compare(tree1: any, tree2: any): Patch<any>[] {
    var patches = [];
    _generate(tree1, tree2, patches, '');
    return patches;
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
  export function validator(operation: Patch<any>, index: number, tree?: any, existingPathFragment?: string) {
    if (typeof operation !== 'object' || operation === null || _isArray(operation)) {
      throw new JsonPatchError('Operation is not an object', 'OPERATION_NOT_AN_OBJECT', index, operation, tree);
    }

    else if (!objOps[operation.op]) {
      throw new JsonPatchError('Operation `op` property is not one of operations defined in RFC-6902', 'OPERATION_OP_INVALID', index, operation, tree);
    }

    else if (typeof operation.path !== 'string') {
      throw new JsonPatchError('Operation `path` property is not a string', 'OPERATION_PATH_INVALID', index, operation, tree);
    }

    else if (operation.path.indexOf('/') !== 0 && operation.path.length > 0) {
      // paths that aren't emptystring should start with "/"
      throw new JsonPatchError('Operation `path` property must start with "/"', 'OPERATION_PATH_INVALID', index, operation, tree);
    }

    else if ((operation.op === 'move' || operation.op === 'copy') && typeof operation.from !== 'string') {
      throw new JsonPatchError('Operation `from` property is not present (applicable in `move` and `copy` operations)', 'OPERATION_FROM_REQUIRED', index, operation, tree);
    }

    else if ((operation.op === 'add' || operation.op === 'replace' || operation.op === 'test') && operation.value === undefined) {
      throw new JsonPatchError('Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)', 'OPERATION_VALUE_REQUIRED', index, operation, tree);
    }

    else if ((operation.op === 'add' || operation.op === 'replace' || operation.op === 'test') && hasUndefined(operation.value)) {
      throw new JsonPatchError('Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)', 'OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED', index, operation, tree);
    }

    else if (tree) {
      if (operation.op == "add") {
        var pathLen = operation.path.split("/").length;
        var existingPathLen = existingPathFragment.split("/").length;
        if (pathLen !== existingPathLen + 1 && pathLen !== existingPathLen) {
          throw new JsonPatchError('Cannot perform an `add` operation at the desired path', 'OPERATION_PATH_CANNOT_ADD', index, operation, tree);
        }
      }
      else if (operation.op === 'replace' || operation.op === 'remove' || (<any>operation.op) === '_get') {
        if (operation.path !== existingPathFragment) {
          throw new JsonPatchError('Cannot perform the operation at a path that does not exist', 'OPERATION_PATH_UNRESOLVABLE', index, operation, tree);
        }
      }
      else if (operation.op === 'move' || operation.op === 'copy') {
        var existingValue: any = { op: "_get", path: operation.from, value: undefined };
        var error = jsonpatch.validate([existingValue], tree);
        if (error && error.name === 'OPERATION_PATH_UNRESOLVABLE') {
          throw new JsonPatchError('Cannot perform the operation from a path that does not exist', 'OPERATION_FROM_UNRESOLVABLE', index, operation, tree);
        }
      }
    }
  }

  /**
   * Validates a sequence of operations. If `tree` parameter is provided, the sequence is additionally validated against the object tree.
   * If error is encountered, returns a JsonPatchError object
   * @param sequence
   * @param tree
   * @returns {JsonPatchError|undefined}
   */
  export function validate(sequence: Patch<any>[], tree?: any): JsonPatchError {
    try {
      if (!_isArray(sequence)) {
        throw new JsonPatchError('Patch sequence must be an array', 'SEQUENCE_NOT_AN_ARRAY');
      }

      if (tree) {
        tree = JSON.parse(JSON.stringify(tree)); //clone tree so that we can safely try applying operations
        apply.call(this, tree, sequence, true);
      }
      else {
        for (var i = 0; i < sequence.length; i++) {
          this.validator(sequence[i], i);
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
declare var exports;

if (typeof exports !== "undefined") {
  exports.apply = jsonpatch.apply;
  exports.applyPatch = jsonpatch.applyPatch;
  exports.observe = jsonpatch.observe;
  exports.unobserve = jsonpatch.unobserve;
  exports.generate = jsonpatch.generate;
  exports.compare = jsonpatch.compare;
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
some of them. Here is super light wieght fix.
*/
if (isBrowser) {
  exports = undefined
}
