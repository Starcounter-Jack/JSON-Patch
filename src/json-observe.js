/** Class representing a JS Object observer  */
var JsonObserver = (function () {
    function JsonObserver(root) {
        this.originalObject = root;
        this.cachedProxy = null;
        this.isRecording = false;
        this.userCallback;
        var sender = this;
        /*
        instead of setting a boolean to
        be checked every time an operation
        is being recorded, I'm removing the
        whole callback when it's disabled.
        Because we are only disabling the callback
        once in the beginning, no need to `if` every time
        */
        this.switchObserverOn = function () {
            sender.defaultCallback = function (event) {
                if (sender.isRecording) {
                    sender.patches.push(event);
                }
                if (sender.userCallback) {
                    sender.userCallback(event);
                }
            };
        };
        this.switchObserverOff = function () {
            sender.defaultCallback = function () { };
        };
    }
    JsonObserver.prototype.deepClone = function (obj) {
        switch (typeof obj) {
            case "object":
                return JSON.parse(JSON.stringify(obj)); //Faster than ES5 clone - http://jsperf.com/deep-cloning-of-objects/5
            case "undefined":
                return null; //this is how JSON.stringify behaves for array items
            default:
                return obj; //no need to clone primitives
        }
    };
    JsonObserver.prototype.escapePathComponent = function (str) {
        if (str.indexOf('/') === -1 && str.indexOf('~') === -1)
            return str;
        return str.replace(/~/g, '~0').replace(/\//g, '~1');
    };
    JsonObserver.prototype.generateProxyAtPath = function (obj, path) {
        if (!obj) {
            return obj;
        }
        var instance = this;
        var proxy = new Proxy(obj, {
            get: function (target, propKey, receiver) {
                if (propKey.toString() === '_proxy') {
                    return true; //to distinguish proxies
                }
                return Reflect.get(target, propKey, receiver);
            },
            set: function (target, key, receiver) {
                var distPath = path + '/' + instance.escapePathComponent(key.toString());
                // if the new value is an object, make sure to watch it          
                if (receiver /* because `null` is in object */ && typeof receiver === 'object' && receiver._proxy !== true) {
                    receiver = instance.generateProxyAtPath(receiver, distPath);
                }
                if (typeof receiver === 'undefined') {
                    if (target.hasOwnProperty(key)) {
                        // when array element is set to `undefined`, should generate replace to `null` 
                        if (Array.isArray(target)) {
                            //undefined array elements are JSON.stringified to `null`
                            instance.defaultCallback({ op: 'replace', path: distPath, value: null });
                        }
                        else {
                            instance.defaultCallback({ op: 'remove', path: distPath });
                        }
                        return Reflect.set(target, key, receiver);
                    }
                    else if (!Array.isArray(target)) {
                        return Reflect.set(target, key, receiver);
                    }
                }
                if (Array.isArray(target) && !Number.isInteger(+key.toString())) {
                    return Reflect.set(target, key, receiver);
                }
                if (target.hasOwnProperty(key)) {
                    if (typeof target[key] === 'undefined') {
                        if (Array.isArray(target)) {
                            instance.defaultCallback({ op: 'replace', path: distPath, value: receiver });
                        }
                        else {
                            instance.defaultCallback({ op: 'add', path: distPath, value: receiver });
                        }
                        return Reflect.set(target, key, receiver);
                    }
                    else {
                        instance.defaultCallback({ op: 'replace', path: distPath, value: receiver });
                        return Reflect.set(target, key, receiver);
                    }
                }
                else {
                    instance.defaultCallback({ op: 'add', path: distPath, value: receiver });
                    return Reflect.set(target, key, receiver);
                }
            },
            deleteProperty: function (target, key) {
                if (typeof target[key] !== 'undefined') {
                    instance.defaultCallback({ op: 'remove', path: path + '/' + instance.escapePathComponent(key.toString()) });
                }
                // else {
                return Reflect.deleteProperty(target, key);
            }
        });
        return proxy;
    };
    //grab tree's leaves one by one, encapsulate them into a proxy and return
    JsonObserver.prototype._proxifyObjectTreeRecursively = function (root, path) {
        for (var key in root) {
            if (root.hasOwnProperty(key)) {
                if (typeof root[key] === 'object') {
                    var distPath = path + '/' + this.escapePathComponent(key);
                    root[key] = this.generateProxyAtPath(root[key], distPath);
                    this._proxifyObjectTreeRecursively(root[key], distPath);
                }
            }
        }
        return this.generateProxyAtPath(root, "");
    };
    //this function is for aesthetic purposes
    JsonObserver.prototype.proxifyObjectTree = function (root) {
        /*
        while proxyifying object tree,
        the proxyifying operation itself is being
        recorded, which in an unwanted behavior,
        that's why we disable recording through this
        initial process;
        */
        this.switchObserverOff();
        var proxifiedObject = this._proxifyObjectTreeRecursively(root, "");
        /* OK you can record now */
        this.switchObserverOn();
        return proxifiedObject;
    };
    /**
     * Proxifies the object that was passed in the constructor and returns a proxified mirror of it.
     * @param {boolean} record - whether to record object changes to a later-retrievable patches array.
     * @param {function} [callback] - this will be synchronously called with every object change.
     */
    JsonObserver.prototype.observe = function (record, callback) {
        if (!record && !callback) {
            throw new Error('You need to either record changes or pass a defaultCallback');
        }
        this.isRecording = record;
        if (callback)
            this.userCallback = callback;
        /*
        I moved it here to remove it from `unobserve`,
        this will also make the constructor faster, why initiate
        the array before they decide to actually observe with recording?
        They might need to use only a callback.
        */
        if (record)
            this.patches = [];
        return this.cachedProxy = this.proxifyObjectTree(this.deepClone(this.originalObject));
    };
    /**
     * If the observed is set to record, it will synchronously return all the patches and empties patches array.
     */
    JsonObserver.prototype.generate = function () {
        if (!this.isRecording) {
            throw new Error('You should set record to true to get patches later');
        }
        /*
        TODO: here, we could remove duplicates.
        But we can't just UNIQUE the array.
        because consider [change1, change2, change1]
        assuming all changes are on the same path,
        both change1's are necessary.
        */
        return this.patches.splice(0, this.patches.length);
    };
    /**
     * Synchronously de-proxifies the last state of the object and returns it unobserved.
     */
    JsonObserver.prototype.unobserve = function () {
        //return a normal, non-proxified object
        return this.deepClone(this.cachedProxy);
    };
    return JsonObserver;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = JsonObserver;
