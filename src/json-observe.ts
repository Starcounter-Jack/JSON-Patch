/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * json-patch-duplex.js version: 1.1.2
 * (c) 2013 Joachim Wester
 * MIT license
 */
declare var Proxy: any;
declare var Reflect: any;
declare var module: any;

function _isArray(obj) { return Array.isArray ? Array.isArray(obj) : function (obj) { return obj.push && typeof obj.length === 'number' } };
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

class JsonObserver {

  private originalObject;
  private exposedObject: Object;
  private cachedProxy: Object;
  private patches: Array<Object>;
  private isRecording: boolean;
  private defaultCallback: Function;
  public userCallback: Function;
  public disableCallback: boolean;

  escapePathComponent(str) {
    if (str.indexOf('/') === -1 && str.indexOf('~') === -1) return str;
    return str.replace(/~/g, '~0').replace(/\//g, '~1');
  }
  generateProxyAtPath(obj, path) {

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

          //https://github.com/Starcounter-Jack/JSON-Patch/issues/125
          if(typeof receiver === 'function')
          {            
            return Reflect.set(target, key, receiver);
          }

          var distPath = path + '/' + instance.escapePathComponent(key.toString());
          // if the new value is an object, make sure to watch it          
          if (receiver && typeof receiver === 'object' && receiver._proxy !== true) {
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
            //when new property is added, and set to `undefined`, nothing should be generated (undefined is JSON.stringified to no value
            else if (!_isArray(target)) {
              return Reflect.set(target, key, receiver);
            }
            //else use the origian settor below
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
          else
            instance.defaultCallback({ op: 'add', path: distPath, value: receiver });

          return Reflect.set(target, key, receiver);
        },
        deleteProperty: function (target, key) {

          //when when an `undefined` property is deleted
          if (typeof target[key] === 'undefined')
            return Reflect.deleteProperty(target, key);

          // else {
          var distPath = path + '/' + instance.escapePathComponent(key.toString());
          instance.defaultCallback({ op: 'remove', path: distPath });
          return Reflect.deleteProperty(target, key);
        }
      });
    return proxy;
  }

  //grab tree's leaves one by one, encapsulate them into a proxy and return
  private _proxifyObjectTreeRecursively(root: any, path): any {
    if(!path) path = "";
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
  }

  //this function is for aesthetic purposes
  private proxifyObjectTree(root: any, path): any {
    
    if(!path) path = "";
    /*
    while proxyifying object tree,
    the proxyifying operation itself is being
    recorded, which in an unwanted behavior,
    that's why we disable recording through this
    inital process;
    */

    this.disableCallback = true;
    var proxifiedObject = this._proxifyObjectTreeRecursively(root, path);

    /* OK you can record now */
    this.disableCallback = false;

    return proxifiedObject;
  }
  private equalsEvents(op1, op2): boolean {
    if (op1.value && op2.value)
      return op1.op === op2.code && op1.path === op2.path && op1.value === op2.value;

    return op1.op === op2.code && op1.path === op2.path;
  }
  constructor(root) {
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
      }
    } (this);
  }
  public observe(record = false, cb = null) {
    if (!record && !cb) {
      throw new Error('You need to either record changes or pass a defaultCallback');
    }
    this.isRecording = record;
    this.userCallback = cb;
    return this.cachedProxy = this.proxifyObjectTree(deepClone(this.originalObject));
  }
  public generate() {
    if (!this.isRecording) {
      throw new Error('You should set record to true to get patches later');
    }
    /*
    TODO: here, we could remove duplicates.
    But we can't just UNINQE the array.
    because consider [change1, change2, change1]
    assuming all changes are on the same path,
    both change1's are neccessary. 
    */

    return this.patches.splice(0, this.patches.length);
  }
  public unobserve(deleteHistory = true) {
    if (deleteHistory) this.patches = [];

    //return a normal, non-proxified object
    return deepClone(this.cachedProxy);
  }
}
//ES5
if(module)
{
  module.exports = JsonObserver;
  // TS Transpiler automically adds .default when referecning the package
  module.exports.default = JsonObserver;
}
//ES6
export default JsonObserver;