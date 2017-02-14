var jsonpatch = require('./json-patch-duplex');
var JsonObserver = require('./json-observe').default;

jsonpatch.JsonObserver = JsonObserver;
module.exports = jsonpatch;
