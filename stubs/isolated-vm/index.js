'use strict';

// Stub for isolated-vm - Custom Scripts in Flows will not work
// but all other Directus features work normally

const notSupported = () => {
  throw new Error('Custom Scripts are not supported on this server (isolated-vm not available)');
};

class Isolate {
  constructor() { notSupported(); }
}

class Context {
  constructor() { notSupported(); }
}

class Script {
  constructor() { notSupported(); }
}

class ExternalCopy {
  constructor() { notSupported(); }
}

class Reference {
  constructor() { notSupported(); }
}

class Callback {
  constructor() { notSupported(); }
}

module.exports = { Isolate, Context, Script, ExternalCopy, Reference, Callback };
module.exports.default = module.exports;
