'use strict';

module.exports = function StatusError(message, status, error = null) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.error = error;
  this.status = status;
};

require('util').inherits(module.exports, Error);