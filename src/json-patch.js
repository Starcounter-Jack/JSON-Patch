// json-patch.js 0.3.2
// (c) 2013 Joachim Wester
// MIT license
var jsonpatch;
(function (jsonpatch) {
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
            var temp = { op: "_get", path: this.from };
            apply(tree, [temp]);
            apply(tree, [
                { op: "remove", path: this.from }
            ]);
            apply(tree, [
                { op: "add", path: this.path, value: temp.value }
            ]);
            return true;
        },
        copy: function (obj, key, tree) {
            var temp = { op: "_get", path: this.from };
            apply(tree, [temp]);
            apply(tree, [
                { op: "add", path: this.path, value: temp.value }
            ]);
            return true;
        },
        test: function (obj, key) {
            return (JSON.stringify(obj[key]) === JSON.stringify(this.value));
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

    var _isArray;
    if (Array.isArray) {
        _isArray = Array.isArray;
    } else {
        _isArray = function (obj) {
            return obj.push && typeof obj.length === 'number';
        };
    }

    /// Apply a json-patch operation on an object tree
    function apply(tree, patches, listen) {
        var result = false, p = 0, plen = patches.length, patch;
        while (p < plen) {
            patch = patches[p];

            // Find the object
            var keys = patch.path.split('/');
            var obj = tree;
            var t = 1;
            var len = keys.length;
            while (true) {
                if (_isArray(obj)) {
                    var index = parseInt(keys[t], 10);
                    t++;
                    if (t >= len) {
                        result = arrOps[patch.op].call(patch, obj, index, tree);
                        break;
                    }
                    obj = obj[index];
                } else {
                    var key = keys[t];
                    if (key.indexOf('~') != -1)
                        key = key.replace('~1', '/').replace('~0', '~');
                    t++;
                    if (t >= len) {
                        result = objOps[patch.op].call(patch, obj, key, tree);
                        break;
                    }
                    obj = obj[key];
                }
            }
            p++;
        }
        return result;
    }
    jsonpatch.apply = apply;
})(jsonpatch || (jsonpatch = {}));

if (typeof exports !== "undefined") {
    exports.apply = jsonpatch.apply;
}
//# sourceMappingURL=json-patch.js.map
