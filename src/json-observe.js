/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * json-patch-duplex.js version: 1.1.2
 * (c) 2013 Joachim Wester
 * MIT license
 */
function _isArray(obj) { return Array.isArray ? Array.isArray(obj) : function (obj) { return obj.push && typeof obj.length === 'number'; }; }
;
function isInteger(str) {
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
function deepClone(obj) {
    switch (typeof obj) {
        case "object":
            return JSON.parse(JSON.stringify(obj));
        case "undefined":
            return null;
        default:
            return obj;
    }
}
var JsonObserver = (function () {
    function JsonObserver(root) {
        this.originalObject = root;
        this.cachedProxy = null;
        this.patches = [];
        this.isRecording = false;
        this.userCallback;
        this.defaultCallback = function (sender) {
            return function (event) {
                //don't duplicate exact same events
                //if(sender.patches.length > 0 && this.equalsEvents(sender.patches[sender.patches.length - 1], event)) return;
                if (!sender.disableCallback) {
                    if (sender.isRecording) {
                        sender.patches.push(event);
                    }
                    if (sender.userCallback) {
                        sender.userCallback(event);
                    }
                }
            };
        }(this);
    }
    JsonObserver.prototype.escapePathComponent = function (str) {
        if (str.indexOf('/') === -1 && str.indexOf('~') === -1)
            return str;
        return str.replace(/~/g, '~0').replace(/\//g, '~1');
    };
    JsonObserver.prototype.generateProxyAtPath = function (obj, path) {
        if (!obj)
            return obj;
        path = path === '/' ? '' : path;
        var instance = this;
        var proxy = new Proxy(obj, {
            get: function (target, propKey, receiver) {
                if (propKey.toString() === '_proxy')
                    return true;
                return Reflect.get(target, propKey, receiver);
            },
            set: function (target, key, receiver) {
                var distPath = path + '/' + instance.escapePathComponent(key.toString());
                if (receiver && typeof receiver === 'object' && receiver._proxy !== true) {
                    receiver = instance.generateProxyAtPath(receiver, distPath);
                }
                if (typeof receiver === 'undefined') {
                    if (target.hasOwnProperty(key)) {
                        if (_isArray(target)) {
                            instance.defaultCallback({ op: 'replace', path: distPath, value: null });
                            return Reflect.set(target, key, receiver);
                        }
                        else {
                            instance.defaultCallback({ op: 'remove', path: distPath });
                            return Reflect.set(target, key, receiver);
                        }
                    }
                    else if (!_isArray(target)) {
                        return Reflect.set(target, key, receiver);
                    }
                }
                if (_isArray(target) && !isInteger(key.toString())) {
                    return Reflect.set(target, key, receiver);
                }
                if (target.hasOwnProperty(key)) {
                    if (typeof target[key] === 'undefined') {
                        if (_isArray(target)) {
                            instance.defaultCallback({ op: 'replace', path: distPath, value: receiver });
                            return Reflect.set(target, key, receiver);
                        }
                        else {
                            instance.defaultCallback({ op: 'add', path: distPath, value: receiver });
                            return Reflect.set(target, key, receiver);
                        }
                    }
                    else {
                        instance.defaultCallback({ op: 'replace', path: distPath, value: receiver });
                        return Reflect.set(target, key, receiver);
                    }
                }
                else
                    instance.defaultCallback({ op: 'add', path: distPath, value: receiver });
                return Reflect.set(target, key, receiver);
            },
            deleteProperty: function (target, key) {
                if (typeof target[key] === 'undefined')
                    return Reflect.deleteProperty(target, key);
                var distPath = path + '/' + instance.escapePathComponent(key.toString());
                instance.defaultCallback({ op: 'remove', path: distPath });
                return Reflect.deleteProperty(target, key);
            }
        });
        return proxy;
    };
    JsonObserver.prototype._proxifyObjectTreeRecursively = function (root, path) {
        if (path === void 0) { path = ""; }
        for (var key in root) {
            if (root.hasOwnProperty(key)) {
                var distPath = path + '/' + this.escapePathComponent(key);
                if (typeof root[key] === 'object') {
                    root[key] = this.generateProxyAtPath(root[key], distPath);
                    this._proxifyObjectTreeRecursively(root[key], distPath);
                }
            }
        }
        return this.generateProxyAtPath(root, "/");
    };
    JsonObserver.prototype.proxifyObjectTree = function (root, path) {
        /*
        while proxyifying object tree,
        the proxyifying operation itself is being
        recorded, which in an unwanted behavior,
        that's why we disable recording through this
        inital process;
        */
        if (path === void 0) { path = ""; }
        this.disableCallback = true;
        var proxifiedObject = this._proxifyObjectTreeRecursively(root, path);
        this.disableCallback = false;
        return proxifiedObject;
    };
    JsonObserver.prototype.equalsEvents = function (op1, op2) {
        if (op1.value && op2.value)
            return op1.op === op2.code && op1.path === op2.path && op1.value === op2.value;
        return op1.op === op2.code && op1.path === op2.path;
    };
    JsonObserver.prototype.observe = function (record, cb) {
        if (record === void 0) { record = false; }
        if (cb === void 0) { cb = null; }
        if (!record && !cb) {
            throw new Error('You need to either record changes or pass a defaultCallback');
        }
        this.isRecording = record;
        this.userCallback = cb;
        return this.cachedProxy = this.proxifyObjectTree(deepClone(this.originalObject));
    };
    JsonObserver.prototype.generate = function () {
        if (!this.isRecording) {
            throw new Error('You should set record to true to get patches later');
        }
        return this.patches.splice(0, this.patches.length);
    };
    JsonObserver.prototype.unobserve = function (deleteHistory) {
        if (deleteHistory === void 0) { deleteHistory = true; }
        if (deleteHistory)
            this.patches = [];
        return deepClone(this.cachedProxy);
    };
    return JsonObserver;
})();
if (module)
    module.exports = JsonObserver;
exports.default = JsonObserver;
