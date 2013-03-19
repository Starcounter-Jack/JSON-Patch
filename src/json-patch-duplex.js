var jsonpatch;
(function (jsonpatch) {
    var objOps = {
        add: function (obj, key) {
            obj[key] = this.value;
        },
        remove: function (obj, key) {
            delete obj[key];
        },
        replace: function (obj, key) {
            obj[key] = this.value;
        },
        move: function (obj, key, tree) {
            var temp = {
                op: "_get",
                path: this.from
            };
            apply(tree, [
                temp
            ], undefined);
            apply(tree, [
                {
                    op: "remove",
                    path: this.from
                }
            ], undefined);
            apply(tree, [
                {
                    op: "add",
                    path: this.path,
                    value: temp.value
                }
            ]);
        },
        copy: function (obj, key, tree) {
            var temp = {
                op: "_get",
                path: this.from
            };
            apply(tree, [
                temp
            ], undefined);
            apply(tree, [
                {
                    op: "add",
                    path: this.path,
                    value: temp.value
                }
            ]);
        },
        test: function (obj, key) {
            if(JSON.stringify(obj[key]) != JSON.stringify(this.value)) {
                throw "";
            }
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
        new: function (patches, path) {
            var patch = {
                op: "add",
                path: path + "/" + this.name,
                value: this.object[this.name]
            };
            patches.push(patch);
        },
        deleted: function (patches, path) {
            var patch = {
                op: "remove",
                path: path + "/" + this.name
            };
            patches.push(patch);
        },
        updated: function (patches, path) {
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
        for(var key in node) {
            var kid = node[key];
            if(kid instanceof Object) {
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
        for(var key in node) {
            var kid = node[key];
            if(kid instanceof Object) {
                clearPaths(observer, kid);
            }
        }
    }
    var beforeDict = {
    };
    function observe(obj, patches, parent) {
        var root = obj;
        if(Object.observe) {
            var observer = function (arr) {
                if(!root.___Path) {
                    Object.unobserve(root, observer);
                    root.____Path = "";
                    markPaths(observer, root);
                    arr.forEach(function (elem) {
                        if(elem.name != "____Path") {
                            observeOps[elem.type].call(elem, patches, elem.object.____Path);
                        }
                    });
                    clearPaths(observer, root);
                }
            };
        } else {
            observer = patches;
            beforeDict[obj] = JSON.parse(JSON.stringify(obj))// Faster than ES5 clone
            ;
        }
        return _observe(observer, obj, patches, parent);
    }
    jsonpatch.observe = observe;
    /// Listen to changes on an object tree, accumulate patches
    function _observe(observer, obj, patches, parent) {
        if(Object.observe) {
            Object.observe(obj, observer);
        }
        for(var key in obj) {
            if(obj.hasOwnProperty(key)) {
                var v = obj[key];
                if(v && typeof (v) === "object") {
                    _observe(observer, v, patches, obj)//path+key);
                    ;
                }
            }
        }
        return observer;
    }
    function generate(obj, observer) {
        if(Object.observe) {
            Object.deliverChangeRecords(observer);
        } else {
            var mirror = beforeDict[obj];
            _generate(mirror, obj, observer, "");
            delete beforeDict[obj];
        }
    }
    jsonpatch.generate = generate;
    // Dirty check if obj is different from mirror, generate patches and update mirror
    function _generate(mirror, obj, patches, path) {
        var newKeys = Object.keys(obj);
        var oldKeys = Object.keys(mirror);
        var changed = false;
        var deleted = false;
        var added = false;
        for(var t = 0; t < oldKeys.length; t++) {
            var key = oldKeys[t];
            var oldVal = mirror[key];
            if(obj.hasOwnProperty(key)) {
                var newVal = obj[key];
                if(oldVal instanceof Object) {
                    _generate(oldVal, newVal, patches, path + "/" + key);
                } else {
                    if(oldVal != newVal) {
                        changed = true;
                        patches.push({
                            op: "replace",
                            path: path + "/" + key,
                            value: newVal
                        });
                        mirror[key] = newVal;
                    }
                }
            } else {
                patches.push({
                    op: "remove",
                    path: path + "/" + key
                });
                deleted = true// property has been deleted
                ;
            }
        }
        if(!deleted && newKeys.length == oldKeys.length) {
            return;
        }
        for(var t = 0; t < newKeys.length; t++) {
            var key = newKeys[t];
            if(!mirror.hasOwnProperty(key)) {
                patches.push({
                    op: "add",
                    path: path + "/" + key,
                    value: obj[key]
                });
            }
        }
    }
    /// Apply a json-patch operation on an object tree
    function apply(tree, patches, listen) {
        try  {
            patches.forEach(function (patch) {
                // Find the object
                var keys = patch.path.split('/');
                keys.shift()// Remove empty element
                ;
                var obj = tree;
                var t = 0;
                var len = keys.length;
                while(true) {
                    if(obj instanceof Array) {
                        var index = parseInt(keys[t], 10);
                        t++;
                        if(t >= len) {
                            arrOps[patch.op].call(patch, obj, index, tree)// Apply patch
                            ;
                            break;
                        }
                        obj = obj[index];
                    } else {
                        var key = keys[t];
                        if(key.indexOf('~') != -1) {
                            key = key.replace('~1', '/').replace('~0', '~');
                        }// escape chars
                        
                        t++;
                        if(t >= len) {
                            objOps[patch.op].call(patch, obj, key, tree)// Apply patch
                            ;
                            break;
                        }
                        obj = obj[key];
                    }
                }
            });
        } catch (e) {
            return false;
        }
        return true;
    }
    jsonpatch.apply = apply;
})(jsonpatch || (jsonpatch = {}));
//@ sourceMappingURL=json-patch-duplex.js.map
