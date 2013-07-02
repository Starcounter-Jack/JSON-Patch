// json-patch-duplex.js 0.3
// (c) 2013 Joachim Wester
// MIT license

interface Object {
  observe : any;
  deliverChangeRecords : any;
  unobserve : any;
}

module jsonpatch {

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
      return(JSON.stringify(obj[key]) === JSON.stringify(this.value));
    },
    _get: function (obj, key) {
      this.value = obj[key];
    }
  };

  var arrOps = {
    add: function (arr, i) {
      arr.splice(i, 0, this.value);
    },
    remove: function (arr, i) {
      arr.splice(i, 1);
    },
    replace: function (arr, i) {
      arr[i] = this.value;
    },
    move: objOps.move,
    copy: objOps.copy,
    test: objOps.test,
    _get: objOps._get
  };

  var observeOps = {
    new: function (patches:any[], path) {
      var patch = {
        op: "add",
        path: path + "/" + this.name,
        value: this.object[this.name]};
      patches.push(patch);
    },
    deleted: function (patches:any[], path) {
      var patch = {
        op: "remove",
        path: path + "/" + this.name
      };
      patches.push(patch);
    },
    updated: function (patches:any[], path) {
      var patch = {
        op: "replace",
        path: path + "/" + this.name,
        value: this.object[this.name]
      };
      patches.push(patch);
    }
  };

  // ES6 symbols are not here yet. Used to calculate the json pointer to each object
  function markPaths(observer, node) {
    for (var key in node) {
      var kid = node[key];
      if (kid instanceof Object) {
        Object.unobserve(kid, observer);
        kid.____Path = node.____Path + "/" + key;
        markPaths(observer, kid);
      }
    }
  }

  // Detach poor mans ES6 symbols
  function clearPaths(observer, node) {
    delete node.____Path;
    Object.observe(node, observer);
    for (var key in node) {
      var kid = node[key];
      if (kid instanceof Object) {
        clearPaths(observer, kid);
      }
    }
  }

  var beforeDict = [];
  var callbacks = [];

  export function observe(obj:any, callback):any {
    var patches = [];
    var root = obj;
    if (Object.observe) {
      var observer = function (arr) {

        if (!root.___Path) {

          Object.unobserve(root, observer);
          root.____Path = "";
          markPaths(observer, root);

          arr.forEach(function (elem) {
            if (elem.name != "____Path") {
              observeOps[elem.type].call(elem, patches, elem.object.____Path);
            }
          });

          clearPaths(observer, root);
        }
        if (callback)
          callback(patches);
      };
    }
    else {
      observer = {};

      var mirror;
      for (var i = 0, ilen = beforeDict.length; i < ilen; i++) {
        if (beforeDict[i].obj === obj) {
          mirror = beforeDict[i];
          break;
        }
      }

      if (!mirror) {
        mirror = {obj: obj};
        beforeDict.push(mirror);
      }

      mirror.value = JSON.parse(JSON.stringify(obj)); // Faster than ES5 clone

      if (callback) {
        callbacks.push(callback);
        var next;
        var intervals = [100, 1000, 10000, 60000];
        var currentInterval = 0;

        var dirtyCheck = function () {
          var temp = generate(observer);
          if (temp.length > 0) {
            observer.patches = [];
            callback(temp);
          }
        };
        var fastCheck = function () {
          clearTimeout(next);
          next = setTimeout(function () {
            dirtyCheck();
            currentInterval = 0;
            next = setTimeout(slowCheck, intervals[currentInterval++]);
          }, 0);
        };
        var slowCheck = function () {
          dirtyCheck();
          if (currentInterval == intervals.length)
            currentInterval = intervals.length - 1;
          next = setTimeout(slowCheck, intervals[currentInterval++]);
        };
        if(typeof window !== 'undefined') {
          ["mousedown", "mouseup", "keydown"].forEach(function (str) {
            window.addEventListener(str, fastCheck);
          });
        }
        next = setTimeout(slowCheck, intervals[currentInterval++]);
      }
    }
    observer.patches = patches;
    observer.object = obj;
    return _observe(observer, obj, patches);
  }

  /// Listen to changes on an object tree, accumulate patches
  function _observe(observer:any, obj:any, patches:any[]):any {
    if (Object.observe)
      Object.observe(obj, observer);
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var v:any = obj[key];
        if (v && typeof (v) === "object") {
          _observe(observer, v, patches); //path+key);
        }
      }
    }
    return observer;
  }

  export function generate(observer) {
    if (Object.observe) {
      Object.deliverChangeRecords(observer);
    }
    else {
      var mirror;
      for (var i = 0, ilen = beforeDict.length; i < ilen; i++) {
        if (beforeDict[i].obj === observer.object) {
          mirror = beforeDict[i];
          break;
        }
      }
      _generate(mirror.value, observer.object, observer.patches, "");
    }
    return observer.patches;
  }


  // Dirty check if obj is different from mirror, generate patches and update mirror
  function _generate(mirror, obj, patches, path) {
    var newKeys = Object.keys(obj);
    var oldKeys = Object.keys(mirror);
    var changed = false;
    var deleted = false;

    for (var t = 0; t < oldKeys.length; t++) {
      var key = oldKeys[t];
      var oldVal = mirror[key];
      if (obj.hasOwnProperty(key)) {
        var newVal = obj[key];
        if (oldVal instanceof Object) {
          _generate(oldVal, newVal, patches, path + "/" + key);
        }
        else {
          if (oldVal != newVal) {
            changed = true;
            patches.push({op: "replace", path: path + "/" + key, value: newVal});
            mirror[key] = newVal;
          }
        }
      }
      else {
        patches.push({op: "remove", path: path + "/" + key});
        deleted = true; // property has been deleted
      }
    }

    if (!deleted && newKeys.length == oldKeys.length) {
      return;
    }

    for (var t = 0; t < newKeys.length; t++) {
      var key = newKeys[t];
      if (!mirror.hasOwnProperty(key)) {
        patches.push({op: "add", path: path + "/" + key, value: obj[key]});
      }
    }


  }

  /// Apply a json-patch operation on an object tree
  export function apply(tree:any, patches:any[], listen?:any):bool {
    var result = false;
    patches.forEach(function (patch:any) {
      // Find the object
      var keys = patch.path.split('/');
      var obj = tree;
      var t = 1; //skip empty element - http://jsperf.com/to-shift-or-not-to-shift
      var len = keys.length;
      while (true) {
        if (Array.isArray(obj)) { //http://jsperf.com/isarray-shim/4
          var index = parseInt(keys[t], 10);
          t++;
          if (t >= len) {
            result = arrOps[patch.op].call(patch, obj, index, tree); // Apply patch
            break;
          }
          obj = obj[index];
        }
        else {
          var key = keys[t];
          if (key.indexOf('~') != -1)
            key = key.replace('~1', '/').replace('~0', '~'); // escape chars
          t++;
          if (t >= len) {
            result = objOps[patch.op].call(patch, obj, key, tree); // Apply patch
            break;
          }
          obj = obj[key];
        }
      }
    });
    return result;
  }
}

declare var exports: any;

if (typeof exports !== "undefined") {
  exports.apply = jsonpatch.apply;
  exports.observe = jsonpatch.observe;
  exports.generate = jsonpatch.generate;
}