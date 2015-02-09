function loadJsonTestSuite(name, url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      var json = JSON.parse(xhr.responseText);
      executeJsonTestSuite(name, json);
      callback();
    }
  }
  xhr.open('GET', url, true);
  xhr.send();
}

if (typeof Array.prototype.forEach != 'function') {
  Array.prototype.forEach = function(callback){
    for (var i = 0; i < this.length; i++){
      callback.apply(this, [this[i], i, this]);
    }
  };
}

function executeJsonTestSuite(name, tests) {
  describe("json-patch-tests", function () {
    describe(name, function () {
      tests.forEach(function (test) {
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
              if (res === false) {
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
}