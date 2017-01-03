/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * json-patch-duplex.js version: 1.1.2
 * (c) 2013 Joachim Wester
 * MIT license
 */
declare var Proxy: any;
declare var Reflect: any;
declare var module: any;

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
/** Class representing a JS Object observer . */
class JsonObserver {

  private originalObject;
  private exposedObject: Object;
  private cachedProxy: Object;
  private patches: Array<Object>;
  private isRecording: boolean;
  private defaultCallback: Function;
  public userCallback: Function;

  /**
   * Disables and enables operation recording and/or callback firing when object modifications happen.
   * @param {boolean} enable - true will enable, false will disable.
   */
  public disableEnableCallback: Function;

  private escapePathComponent(str) {
    if (str.indexOf('/') === -1 && str.indexOf('~') === -1) return str;
    return str.replace(/~/g, '~0').replace(/\//g, '~1');
  }
  private generateProxyAtPath(obj, path) {

    if (!obj) return obj;

    path = path === '/' ? '' : path; //root
    var instance = this;
    let proxy = new Proxy(obj,
    {
        get: (target, propKey, receiver) => {
          if (propKey.toString() === '_proxy') return true; //to distinguish proxies
          return Reflect.get(target, propKey, receiver);
        },
        set: function (target, key, receiver) {

          /* 
          https://github.com/Starcounter-Jack/JSON-Patch/issues/125
          TODO: I didn't remove it to benchmark it later
          if(typeof receiver === 'function')
          {            
            return Reflect.set(target, key, receiver);
          }
          */

          var distPath = path + '/' + instance.escapePathComponent(key.toString());
          // if the new value is an object, make sure to watch it          
          if (receiver /* because `null` is in object */ && typeof receiver === 'object' && receiver._proxy !== true) {
            receiver = instance.generateProxyAtPath(receiver, distPath);
          }

          if (typeof receiver === 'undefined') {
            if (target.hasOwnProperty(key))  //exists
            {
              // when array element is set to `undefined`, should generate replace to `null` 
              if (_isArray(target)) {
                //undefined array elements are JSON.stringified to `null`
                instance.defaultCallback({ op: 'replace', path: distPath, value: null });
                return Reflect.set(target, key, receiver);
              }
              else {
                instance.defaultCallback({ op: 'remove', path: distPath });
                return Reflect.set(target, key, receiver);
              }
            }
            //when a new property is added, and is set to `undefined`, nothing should be generated (undefined is JSON.stringified to no value)
            else if (!_isArray(target)) {
              return Reflect.set(target, key, receiver);
            }
          }
          if (_isArray(target) && !isInteger(key.toString())) //array attribute, don't intercept it
          {
            return Reflect.set(target, key, receiver);
          }
          if (target.hasOwnProperty(key))  //exists
          {
            if (typeof target[key] === 'undefined') {
              if (_isArray(target)) {
                instance.defaultCallback({ op: 'replace', path: distPath, value: receiver });
                return Reflect.set(target, key, receiver);
              }
              //when `undefined` property is set to something, should generate add (undefined in JSON.stringified to no value)
              else //object
              {
                instance.defaultCallback({ op: 'add', path: distPath, value: receiver });
                return Reflect.set(target, key, receiver);
              }
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

          //when when an `undefined` property is deleted, record nothing
          if (typeof target[key] === 'undefined') {
            return Reflect.deleteProperty(target, key);
          }

          // else {
          instance.defaultCallback({ op: 'remove', path: path + '/' + instance.escapePathComponent(key.toString()) });
          return Reflect.deleteProperty(target, key);
        }
      });
    return proxy;
  }

  //grab tree's leaves one by one, encapsulate them into a proxy and return
  private _proxifyObjectTreeRecursively(root: any, path): any {
    for (var key in root) {
      if (root.hasOwnProperty(key)) {
        if (typeof root[key] === 'object') {
          var distPath = path + '/' + this.escapePathComponent(key);
          root[key] = this.generateProxyAtPath(root[key], distPath);
          this._proxifyObjectTreeRecursively(root[key], distPath);
        }
      }
    }
    return this.generateProxyAtPath(root, "/");
  }

  //this function is for aesthetic purposes
  private proxifyObjectTree(root: any): any {
    
    /*
    while proxyifying object tree,
    the proxyifying operation itself is being
    recorded, which in an unwanted behavior,
    that's why we disable recording through this
    initial process;
    */

    this.disableEnableCallback(false);
    var proxifiedObject = this._proxifyObjectTreeRecursively(root, "");

    /* OK you can record now */
    this.disableEnableCallback(true);

    return proxifiedObject;
  }

  constructor(root) {
    this.originalObject = root;
    this.cachedProxy = null;
    this.isRecording = false;
    this.userCallback;
    var sender = this;
    /* 
    instead of setting a boolean to
    be checked every time an operation
    is being recording, I'm removing the 
    whole callback when it's disabled.
    Because we are only disabling the callback
    once in the beginning, no need to `if` every time
    */
    this.disableEnableCallback = function(enable: boolean)
    {
        if(enable)
        {
          sender.defaultCallback = function (event) {
              if (sender.isRecording) {
                sender.patches.push(event);
              }
              if (sender.userCallback) {
                sender.userCallback(event);
              }
            }            
        }
        else /* if (disable) */
        {
            sender.defaultCallback = function(){};
        }
    }
  }
  /**
   * Proxifies the object that was passed in the constructor and returns a proxified mirror of it.
   * @param {boolean} record - whether to record object changes to a later-retrievable patches array.
   * @param {function} [callback] - this will be synchronously called with every object change.
   */
  public observe(record, callback) {
    if (!record && !callback) {
      throw new Error('You need to either record changes or pass a defaultCallback');
    }
    this.isRecording = record;
    if(callback) this.userCallback = callback;

    /* 
    I moved it here to remove it from `unobserve`,
    this will also make the constructor faster, why initiate
    the array before they decide to actually observe with recording? 
    They might need to use only a callback.
    */
    if(record) this.patches = [];
    return this.cachedProxy = this.proxifyObjectTree(deepClone(this.originalObject));
  }
  /**
   * If the observed is set to record, it will synchronously return all the patches and empties patches array.
   */
  public generate() {
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
  }
  /**
   * Synchronously de-proxifies the last state of the object and returns it unobserved.
   */
  public unobserve() {
    //return a normal, non-proxified object
    return deepClone(this.cachedProxy);
  }
}
//ES5
if(module)
{
  module.exports = JsonObserver;
  // TS Transpiler automatically adds .default when referencing the package
  module.exports.default = JsonObserver;
}
else
{
  var exports:any = {};
  var isBrowser = true;
}

export default JsonObserver;

/*
When in browser, setting `exports = {}`
fools other modules into thinking they're
running in a node environment, which breaks
some of them. Here is super light weight fix.
*/
if(isBrowser)
{
  exports = undefined
}
