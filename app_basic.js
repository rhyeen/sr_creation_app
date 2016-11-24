/**
 * Add cability to do:
 * 'The {0} {1} fox jumped over the {1} {0} cow'.format('quick', 'brown');
 */
String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) { 
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};

var connectionError = function(err, connection, res) {
  if (err) {
    console.error("ERROR: Connection could not be established.\n");
    res.status(500).send('Could not connect to the database.');
    if (connection) {
      connection.release();
    }
    return true;
  }
  return false;
}

var queryError = function(err, connection) {
  if (err) {
    console.error("ERROR: Query failed unexpectedly.\n");
    if (connection) {
      connection.release();
    }
    return true;
  }
  return false;
}

var helpers = {
  connection: {
    connectionError: connectionError,
    queryError: queryError
  }
};

var STATICS = {
  route_endpoints: {
    default: "/open",
    secured: "/user",
    auth: "/auth",
    private_serve: "../private-serve"
  }
};

STATICS.route_roots = {
  pages: STATICS.route_endpoints.secured + "/page"
};

STATICS.routes = {
  healthcheck: STATICS.route_endpoints.default + "/healthcheck",
  overview_page: STATICS.route_roots.pages + "/overview"
};

//// required
var express = require('express');
var path = require('path');
var logger = require('morgan');
var Promise = require("bluebird");

//// app-specific
var bodyParser = require('body-parser');
// MySQL pools
var mysql = require('mysql');
// Note that the library's classes are not properties of the main export
// so we require and promisifyAll them manually
// Promise.promisifyAll(require("mysql/lib/Connection").prototype);
// Promise.promisifyAll(require("mysql/lib/Pool").prototype);

var pool = mysql.createPool({
  connectionLimit : 20,
  host: 'shardrealms.com',
  user: 'sr_creation_dev',
  password: 'Fk94V3nIdc',
  database: 'sr_creation_dev'
});

var app = express();
app.use(logger('dev'));
app.set('view engine', 'jade');

var healthcheck_service = require('./routes/healthcheck/index')(app, STATICS);
var page_service = require('./routes/page/index')(app, STATICS, helpers, Promise, pool);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
