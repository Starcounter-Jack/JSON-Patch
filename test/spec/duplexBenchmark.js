if (typeof window === 'undefined') {
  const jsdom = require("jsdom");
  const { JSDOM } = jsdom;
  const dom = new JSDOM();
  global.window = dom.window;
  global.document = dom.window.document;
}

if (typeof jsonpatch === 'undefined') {
  jsonpatch = require('./../..');
}

if (typeof Benchmark === 'undefined') {
  global.Benchmark = require('benchmark');
  global.benchmarkResultsToConsole = require('./../lib/benchmark_console_reporter.js').benchmarkResultsToConsole;
}

const duplexSuite = new Benchmark.Suite();
duplexSuite.add('generate operation', {
  setup: function() {
    const obj = {
      firstName: 'Albert',
      lastName: 'Einstein',
      phoneNumbers: [
        {
          number: '12345'
        },
        {
          number: '45353'
        }
      ]
    };
    const observer = jsonpatch.observe(obj);
  },
  fn: function() {
    obj.firstName = 'Joachim';
    obj.lastName = 'Wester';
    obj.phoneNumbers[0].number = '123';
    obj.phoneNumbers[1].number = '456';

    const patches = jsonpatch.generate(observer);
  }
});
duplexSuite.add('generate operation and re-apply', {
  setup: function() {
    const obj = {
      firstName: 'Albert',
      lastName: 'Einstein',
      phoneNumbers: [
        {
          number: '12345'
        },
        {
          number: '45353'
        }
      ]
    };
    const observer = jsonpatch.observe(obj);
  },
  fn: function() {
    obj.firstName = 'Joachim';
    obj.lastName = 'Wester';
    obj.phoneNumbers[0].number = '123';
    obj.phoneNumbers[1].number = '456';

    const patches = jsonpatch.generate(observer);
    obj2 = {
      firstName: 'Albert',
      lastName: 'Einstein',
      phoneNumbers: [
        {
          number: '12345'
        },
        {
          number: '45353'
        }
      ]
    };

    jsonpatch.applyPatch(obj2, patches);
  }
});
duplexSuite.add('compare operation', {
  setup: function() {
    const obj = {
      firstName: 'Albert',
      lastName: 'Einstein',
      phoneNumbers: [
        {
          number: '12345'
        },
        {
          number: '45353'
        }
      ]
    };
    const obj2 = {
      firstName: 'Joachim',
      lastName: 'Wester',
      mobileNumbers: [
        {
          number: '12345'
        },
        {
          number: '45353'
        }
      ]
    };
  },
  fn: function() {
    const patches = jsonpatch.compare(obj, obj2);
  }
});

duplexSuite.add('compare operation same but deep objects', {
  setup: function() {
    const depth = 10;

    function shallowObj() {
      return {
        shallow: {
          firstName: 'Tomek',
          lastName: 'Wytrebowicz',
          mobileNumbers: [
            {
              number: '12345'
            },
            {
              number: '45353'
            }
          ]
        }
      };
    }
    const obj = shallowObj();
    const node = obj;
    while (depth-- > 0) {
      node.nested = shallowObj();
      node = node.nested;
    }
    const obj2 = obj;
  },
  fn: function() {
    const patches = jsonpatch.compare(obj, obj2);
  }
});

// Benchmark generating test operations
duplexSuite.add('generate operation, invertible = true', {
  setup: function() {
    const obj = {
      firstName: 'Albert',
      lastName: 'Einstein',
      phoneNumbers: [
        {
          number: '12345'
        },
        {
          number: '45353'
        }
      ]
    };
    const observer = jsonpatch.observe(obj);
  },
  fn: function() {
    obj.firstName = 'Joachim';
    obj.lastName = 'Wester';
    obj.phoneNumbers[0].number = '123';
    obj.phoneNumbers[1].number = '456';

    const patches = jsonpatch.generate(observer, true);
  }
});
duplexSuite.add('generate operation and re-apply, invertible = true', {
  setup: function() {
    const obj = {
      firstName: 'Albert',
      lastName: 'Einstein',
      phoneNumbers: [
        {
          number: '12345'
        },
        {
          number: '45353'
        }
      ]
    };
    const observer = jsonpatch.observe(obj);
  },
  fn: function() {
    obj.firstName = 'Joachim';
    obj.lastName = 'Wester';
    obj.phoneNumbers[0].number = '123';
    obj.phoneNumbers[1].number = '456';

    const patches = jsonpatch.generate(observer, true);
    obj2 = {
      firstName: 'Albert',
      lastName: 'Einstein',
      phoneNumbers: [
        {
          number: '12345'
        },
        {
          number: '45353'
        }
      ]
    };

    jsonpatch.applyPatch(obj2, patches);
  }
});
duplexSuite.add('compare operation, invertible = true', {
  setup: function() {
    const obj = {
      firstName: 'Albert',
      lastName: 'Einstein',
      phoneNumbers: [
        {
          number: '12345'
        },
        {
          number: '45353'
        }
      ]
    };
    const obj2 = {
      firstName: 'Joachim',
      lastName: 'Wester',
      mobileNumbers: [
        {
          number: '12345'
        },
        {
          number: '45353'
        }
      ]
    };
  },
  fn: function() {
    const patches = jsonpatch.compare(obj, obj2, true);
  }
});

duplexSuite.add('compare operation same but deep objects, invertible = true', {
  setup: function() {
    const depth = 10;

    function shallowObj() {
      return {
        shallow: {
          firstName: 'Tomek',
          lastName: 'Wytrebowicz',
          mobileNumbers: [
            {
              number: '12345'
            },
            {
              number: '45353'
            }
          ]
        }
      };
    }
    const obj = shallowObj();
    const node = obj;
    while (depth-- > 0) {
      node.nested = shallowObj();
      node = node.nested;
    }
    const obj2 = obj;
  },
  fn: function() {
    const patches = jsonpatch.compare(obj, obj2, true);
  }
});

// if we are in the browser with benchmark < 2.1.2
if (typeof benchmarkReporter !== 'undefined') {
  benchmarkReporter(duplexSuite);
} else {
  duplexSuite.on('complete', function() {
    benchmarkResultsToConsole(duplexSuite);
  });
  duplexSuite.run();
}
