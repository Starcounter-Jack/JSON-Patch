// Generic Json Pointer Implementation
// See http://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-04.
// Author: Joachim Wester
var JsonPatch;
(function (JsonPatch) {
    /// <summary>
    /// Represents a Json Pointer addressing a single element
    /// in a Json tree.
    ///
    /// Json pointer is defined here:
    /// http://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-09
    /// </summary>
    var JsonPointer = (function () {
        /// <summary>
        /// Creates a new pointer using a Json Patch formatted path string
        /// </summary>
        function JsonPointer(path) {
            if(path) {
                var keys = path.split('/');
                keys.shift()// path starts with '/' such that first element is empty
                ;
                for(var t = 0; t < keys.length; t++) {
                    keys[t] = decodeURIComponent(keys[t]);
                }
                this.Key = keys.pop();
                this.ObjectPath = keys;
            }
        }
        JsonPointer.prototype.Find = /// <summary>
        /// Returns the object pointed to by the 'Path' array.
        /// This object should contain the property specified
        /// in the 'Key' property. I.e. to get the value pointed to
        /// by this Json pointer, you should perform the following code:
        /// var obj = myPointer.Find( root );
        /// var value = obj[myPointer.Key];
        /// </summary>
        function (object) {
            var steps = this.ObjectPath;
            for(var t = 0; t < steps.length; t++) {
                var key = steps[t];
                if(object instanceof Array) {
                    object = object[parseInt(key, 10)];
                } else {
                    object = object[key];
                }
            }
            return object;
        };
        JsonPointer.prototype.GetPath = /// <summary>
        /// Returns this pointer as a path string according to the Json Patch standard.
        /// </summary>
        function () {
            var str = "/";
            for(var t = 0; t < this.ObjectPath.length; t++) {
                str += this.ObjectPath[t] + "/";
            }
            return str + this.Key;
        };
        JsonPointer.AttachPointers = /// <summary>
        /// Notes parent objects and the property key in the parent.
        /// This makes it possible to quickly find the Json pointer of
        /// any object in a json tree.
        /// </summary>
        function AttachPointers(object, parent, key) {
            if(object === null || typeof object != "object") {
                return;
            }
            if(object instanceof Array) {
                // if (toString.apply(a) == '[object Array]') {
                var arr = object;
                for(var i = 0; i < arr.length; i++) {
                    JsonPointer.AttachPointers(arr[i], object, i);
                }
            } else {
                for(var prop in object) {
                    if(object.hasOwnProperty(prop)) {
                        JsonPointer.AttachPointers(object[prop], object, prop);
                    }
                }
            }
            object.__sc0537_parent = parent// Should use ES6 symbol when ES6 is widely available
            ;
            object.__sc0537_key = key// Should use ES6 symbol when ES6 is widely available
            ;
        };
        JsonPointer.Create = /// <summary>
        /// Given that the object tree has been amended using the
        /// AttachPointers function, this method create a JsonPointer
        /// that identifies an individual property.
        /// </summary>
        function Create(object, key) {
            var p = new JsonPointer();
            var path = [];
            while(object && object.__sc0537_key != undefined) {
                path.splice(0, 0, object.__sc0537_key)// Should use ES6 symbol when ES6 is widely available
                ;
                object = object.__sc0537_parent// Should use ES6 symbol when ES6 is widely available
                ;
            }
            p.ObjectPath = path;
            p.Key = key;
            return p;
        };
        return JsonPointer;
    })();
    JsonPatch.JsonPointer = JsonPointer;    
})(JsonPatch || (JsonPatch = {}));
//@ sourceMappingURL=json-pointer.js.map
