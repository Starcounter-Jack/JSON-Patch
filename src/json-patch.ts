/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * json-patch-duplex.js version: 0.5.7
 * (c) 2013 Joachim Wester
 * MIT license
 */

var OriginalError = Error;
module jsonpatch {
  var _objectKeys = (function () {
    if (Object.keys)
      return Object.keys;

    return function (o) { //IE8
      var keys = [];
      for (var i in o) {
        if (o.hasOwnProperty(i)) {
          keys.push(i);
        }
      }
      return keys;
    }
  })();

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
      return true;
    },
    remove: function (obj, key) {
      delete obj[key];
      return true;
    },
    replace: function (obj, key) {
      obj[key] = this.value;
      return true;
    },
    move: function (obj, key, tree) {
      var temp:any = {op: "_get", path: this.from};
      apply(tree, [temp]);
      apply(tree, [
        {op: "remove", path: this.from}
      ]);
      apply(tree, [
        {op: "add", path: this.path, value: temp.value}
      ]);
      return true;
    },
    copy: function (obj, key, tree) {
      var temp:any = {op: "_get", path: this.from};
      apply(tree, [temp]);
      apply(tree, [
        {op: "add", path: this.path, value: temp.value}
      ]);
      return true;
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
      return true;
    },
    remove: function (arr, i) {
      arr.splice(i, 1);
      return true;
    },
    replace: function (arr, i) {
      arr[i] = this.value;
      return true;
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
      return true;
    },
    remove: function (obj) {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          objOps.remove.call(this, obj, key);
        }
      }
      return true;
    },
    replace: function (obj) {
      apply(obj, [
        {op: "remove", path: this.path}
      ]);
      apply(obj, [
        {op: "add", path: this.path, value: this.value}
      ]);
      return true;
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
    _isArray = function (obj:any) {
      return obj.push && typeof obj.length === 'number';
    }
  }

  //3x faster than cached /^\d+$/.test(str)
  function isInteger(str:string):boolean {
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

  /// Apply a json-patch operation on an object tree
  export function apply(tree:any, patches:any[], validate?:boolean):boolean {
    var result = false
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
        if(key === undefined) { //is root
          if (t >= len) {
            result = rootOps[patch.op].call(patch, obj, key, tree); // Apply patch
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
            result = arrOps[patch.op].call(patch, obj, key, tree); // Apply patch
            break;
          }
        }
        else {
          if (key && key.indexOf('~') != -1)
            key = key.replace(/~1/g, '/').replace(/~0/g, '~'); // escape chars
          if (t >= len) {
            result = objOps[patch.op].call(patch, obj, key, tree); // Apply patch
            break;
          }
        }
        obj = obj[key];
      }
    }
    return result;
  }

  export declare class OriginalError {
    public name:string;
    public message:string;
    public stack:string;

    constructor(message?:string);
  }

  export class JsonPatchError extends OriginalError {
    constructor(public message:string, public name:string, public index?:number, public operation?:any, public tree?:any) {
      super(message);
    }
  }

  export var Error = JsonPatchError;

    /**
     * Recursively checks whether an object has any undefined values inside.
     */
    function hasUndefined(obj:any): boolean {
        if (obj === undefined) {
            return true;
        }

        if (typeof obj == "array" || typeof obj == "object") {
            for (var i in obj) {
                if (hasUndefined(obj[i])) {
                    return true;
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
  export function validator(operation:any, index:number, tree?:any, existingPathFragment?:string) {
    if (typeof operation !== 'object' || operation === null || _isArray(operation)) {
      throw new JsonPatchError('Operation is not an object', 'OPERATION_NOT_AN_OBJECT', index, operation, tree);
    }

    else if (!objOps[operation.op]) {
      throw new JsonPatchError('Operation `op` property is not one of operations defined in RFC-6902', 'OPERATION_OP_INVALID', index, operation, tree);
    }

    else if (typeof operation.path !== 'string') {
      throw new JsonPatchError('Operation `path` property is not a string', 'OPERATION_PATH_INVALID', index, operation, tree);
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
      else if(operation.op === 'replace' || operation.op === 'remove' || operation.op === '_get') {
        if (operation.path !== existingPathFragment) {
          throw new JsonPatchError('Cannot perform the operation at a path that does not exist', 'OPERATION_PATH_UNRESOLVABLE', index, operation, tree);
        }
      }
      else if (operation.op === 'move' || operation.op === 'copy') {
        var existingValue = {op: "_get", path: operation.from, value: undefined};
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
  export function validate(sequence:any[], tree?:any):JsonPatchError {
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

declare var exports:any;

if (typeof exports !== "undefined") {
  exports.apply = jsonpatch.apply;
  exports.validate = jsonpatch.validate;
  exports.validator = jsonpatch.validator;
  exports.JsonPatchError = jsonpatch.JsonPatchError;
  exports.Error = jsonpatch.Error;
}
