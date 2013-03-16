// json-patch.js 0.3
// (c) 2013 Joachim Wester
// BSD license

declare interface Object {
   observe : any;
}

module jsonpatch {

   var objOps = {
      add: function(obj,key) { obj[key] = this.value; },
      remove: function(obj,key) {  delete obj[key];},
      replace: function(obj,key) { obj[key] = this.value; },
      move: function(obj,key,tree) {
         var temp : any = {op:"_get",path:this.from};
         apply(tree,[temp],undefined);
         apply(tree,[{op:"remove",path:this.from}],undefined);
         apply(tree,[{op:"add",path:this.path,value:temp.value}]);
      },
      copy: function(obj,key,tree) {
         var temp : any = {op:"_get",path:this.from};
         apply(tree,[temp],undefined);
         apply(tree,[{op:"add",path:this.path,value:temp.value}]);
      },
      test: function(obj,key) {
         if (JSON.stringify(obj[key])!=JSON.stringify(this.value))
            throw "";
      },
      _get: function(obj,key) { this.value = obj[key]; }
   };

   var arrOps = {
      add: function(arr,i) { arr.splice(i,0,this.value); },
      remove: function(arr,i) { arr.splice(i,1); },
      replace: function(arr,i) { arr[i] = this.value; },
      move: objOps.move,
      copy: objOps.copy,
      test: objOps.test,
      _get: objOps._get
   };

   var observeOps = {
      new: function(patches : any[], path) {
         var patch = {
            op: "iadd",
            path: path + this.name,
            value: this.object[this.name]};
         patches.push(patch);
         //console.log( patch );
      },
      deleted: function( patches:any[], path)   {
         var patch = {
            op:"iremove",
            path:path + this.name
         };
         patches.push(patch);
         //console.log( patch );
      },
      updated: function( patches:any[], path)   {
         var patch = {
            op:"ireplace",
            path:path + this.name,
            value:this.object[this.name]
         };
         patches.push(patch);
         //console.log( patch );
      }
   }


   /// Listen to changes on an object tree, accumulate patches
   export function listenTo(obj: any, patches:any[], callback : any) {
      _listenTo(obj,patches,callback,null);

   }

   function _listenTo(obj: any, patches:any[], callback : any, parent:any) {
      //parents[obj] = path;
      Object.observe(obj, function(arr) {
         arr.forEach(function(elem) {
            observeOps[elem.type].call(elem,arr,"?");
         })
         if (callback)
            callback.call(obj,patches);
      });
      //path += "/";
      for (var key in obj) {
         if (obj.hasOwnProperty(key) ) {
            var v: any = obj[key];
            if (v && typeof (v) === "object" ) {
               _listenTo(v,patches,callback,obj); //path+key);
            }
         }
      }
   }


   /// Apply a json-patch operation on an object tree
   export function apply( tree : any, patches : any[], listen?:any ) : bool {

      try {
         patches.forEach( function( patch : any ) {
            //console.log(patch);
            // Find the object
            var keys = patch.path.split('/');
            keys.shift(); // Remove empty element
            var obj = tree;
            var t = 0;
            var len = keys.length;
            while (true) {
               if (obj instanceof Array) {
                  var index = parseInt(keys[t], 10);
                  t++;
                  if (t >= len) {
                     arrOps[patch.op].call(patch,obj,index,tree); // Apply patch
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
                     objOps[patch.op].call(patch,obj,key,tree); // Apply patch
                     break;
                  }
                  obj = obj[key];
               }
            }
         });
      }
      catch (e) {
         return false;
      }
      return true;
   }
}