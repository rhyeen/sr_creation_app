let express = require("express");
let logger = require("morgan");
let bodyParser = require("body-parser");

let app = express();
app.use(logger("dev"));
app.use(bodyParser.json());
app.set("view engine", "jade");

// for CORS - remove once we don't CORS anymore.
app.options("*", function(req, res) {
  let headers = {};
  // IE8 does not allow domains to be specified, just the *
  // headers["Access-Control-Allow-Origin"] = req.headers.origin;
  headers["Access-Control-Allow-Origin"] = "*";
  headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
  headers["Access-Control-Allow-Credentials"] = false;
  headers["Access-Control-Max-Age"] = "86400"; // 24 hours
  headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
  res.writeHead(200, headers);
  res.end();
});

var healthRoutes = require("./routes/healthcheck");
app.use(healthRoutes);

// Load in specific routes
var registerRoutes = require("./routes/registerRoutes")(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: {}
  });
});


module.exports = app;
