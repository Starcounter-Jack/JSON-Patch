var JSONtests = [
    {
        name: "tests.json",
        path: "spec/json-patch-tests/tests.json"
    },
    {
        name: "spec_tests.json",
        path: "spec/json-patch-tests/spec_tests.json"
    }
];

var loadJsonTestSuite;
if (typeof XMLHttpRequest === 'undefined') {
    var jsonfile = require("jsonfile");
    loadJsonTestSuite = function (url, callback) {
        return jsonfile.readFileSync('test/'+url);
    };
} else {
    loadJsonTestSuite = function(url, callback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send();
      return JSON.parse(xhr.responseText);
    }
}

if (typeof Array.prototype.forEach != 'function') {
  Array.prototype.forEach = function(callback){
    for (var i = 0; i < this.length; i++){
      callback.apply(this, [this[i], i, this]);
    }
  };
}

describe("json-patch-tests", function () {
  JSONtests.forEach(function (jsonTest) {
    describe(jsonTest.name, function () {
        loadJsonTestSuite(jsonTest.path).forEach(function(test){

            if (test.disabled) {
              return;
            }
            var testName = test.comment || test.error || JSON.stringify(test.patch);
            if (test.expected) {
              it("should succeed: " + testName, function () {
                jsonpatch.apply(test.doc, test.patch, true);
                expect(test.doc).toEqual(test.expected)
              });
            }
            else if (test.error || test.patch[0].op === "test") {
              it("should throw an error: " + testName, function () {
                var errors = 0;
                try {
                  var res = jsonpatch.apply(test.doc, test.patch, true);
                  if (res[res.length-1] === false) {
                    throw new Error("Test failed");
                  }
                }
                catch (e) {
                  errors++;
                }
                if (test.error) {
                  expect(errors).toBe(1);
                }
                else {
                  expect(errors).toBe(0);
                }
              });
            }
            else {
              throw new Error("invalid test case");
            }
        });
    });
  });
});
