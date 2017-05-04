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

var generateId = function(id_starter) {
  var id_size = 16 - id_starter.length - '_'.length;
  var i;
  var hash = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(i = 0; i < id_size; i++) {
    hash += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return id_starter + '_' + hash;
}

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
    console.error("ERROR: Query failed unexpectedly:\n{0}".format(err));
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
  },
  generator: {
    generateId: generateId
  },
  constant: {
    'PAGE_ID_LENGTH': 16
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
  page: STATICS.route_endpoints.secured + "/page",
  file: STATICS.route_endpoints.secured + "/file",
  article: STATICS.route_endpoints.secured + "/article",
  tag: STATICS.route_endpoints.secured + "/tag",
  private_files: STATICS.route_endpoints.private_serve + "/files"
};

STATICS.routes = {
  page_summary: STATICS.route_roots.page + "/summary",
  page_detail: STATICS.route_roots.page + "/detail",
  page_details: STATICS.route_roots.page + "/details",
  page_links: STATICS.route_roots.page + "/page-links",
  page_image: STATICS.route_roots.page + "/image",
  page_images: STATICS.route_roots.page + "/images",
  healthcheck: STATICS.route_endpoints.default + "/healthcheck",
  render_tags: STATICS.route_roots.tag + "/render",
  page_search: STATICS.route_roots.page + "/search",
  private_images: STATICS.route_roots.private_files + "/images"
};

//// required
var fs = require('fs');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var Promise = require("bluebird");
var formidable = require('formidable');

//// app-specific
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
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

// for CORS - remove once we don't CORS anymore.
app.options('*', function(req, res) {
  var headers = {};
  // IE8 does not allow domains to be specified, just the *
  // headers["Access-Control-Allow-Origin"] = req.headers.origin;
  headers["Access-Control-Allow-Origin"] = "*";
  headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
  headers["Access-Control-Allow-Credentials"] = false;
  headers["Access-Control-Max-Age"] = '86400'; // 24 hours
  headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
  res.writeHead(200, headers);
  res.end();
});

var healthcheck_service = require('./routes/healthcheck/index')(app, STATICS);
var get_page_service = require('./routes/get-page/index')(app, STATICS, helpers, Promise, pool, jsonParser);
var delete_page_service = require('./routes/delete-page/index')(app, STATICS, helpers, Promise, pool, jsonParser);
var put_page_service = require('./routes/put-page/index')(app, STATICS, helpers, Promise, pool, jsonParser);
var page_summary_service = require('./routes/page-summary/index')(app, STATICS, helpers, Promise, pool, jsonParser);
var page_detail_service = require('./routes/page-detail/index')(app, STATICS, helpers, Promise, pool, jsonParser);
var page_details_service = require('./routes/page-details/index')(app, STATICS, helpers, Promise, pool, jsonParser);
var page_image_service = require('./routes/page-image/index')(app, STATICS, helpers, Promise, pool, jsonParser);
var page_image_service = require('./routes/page-images/index')(app, STATICS, helpers, Promise, pool, jsonParser);
var page_links_service = require('./routes/page-links/index')(app, STATICS, helpers, Promise, pool, jsonParser);
var page_search_service = require('./routes/page-search/index')(app, STATICS, helpers, Promise, pool);
var file_service = require('./routes/file/index')(app, STATICS, helpers, formidable, fs, path);

var tag_service = require('./routes/tag/index')(app, STATICS, helpers, Promise, pool, jsonParser);

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
