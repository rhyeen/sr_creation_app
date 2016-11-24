/**
 * DO NOT USE IN PRODUCTION!!!
 * 
 * @TODO: store somewhere a lot safer: like environment variables:
 * For example, when you run the node app, you can run it like such:
 * $ JWT_SECRET_KEY=<like the key below, but a new one> node app.js
 * Or simply put it in a shell script.
 * You can access the variable anytime in node using proces.env.JWT_SECRET_KEY
 * @return {string} the secret key
 */
/* "Since JWTs are not signed using asymmetric encryption 
 *  you do not have to generate your secret key using ssh-keygen. 
 *  You can just as easily use a strong password, 
 *  provided its long and random."
 *  SOURCE: https://github.com/docdis/learn-json-web-tokens
 */
// Generatred from: https://www.grc.com/passwords.htm
var jwtSecretKey = "bKFlDolQiKL79cJKUfpdNyjE24ij43pD4DMBcditFobOqhDwMCxiwkuzTiwtBmA";

var STATICS = {
  routeEndpoints: {
    default: "open",
    secured: "user",
    auth: "auth"
  }
};

STATICS.routeRoots = {
  calendar: STATICS.routeEndpoints.secured + "/calendar",
  privateServe: "../private-serve/"
};

STATICS.routes = {
  calendarEra: STATICS.routeRoots.calendar + "/era",
  calendarNow: STATICS.routeRoots.calendar + "/now",
  login: STATICS.routeEndpoints.auth + "/login",
  register: STATICS.routeEndpoints.auth + "/register",
  check: STATICS.routeEndpoints.auth + "/check"
};

var express = require('express');

var path = require('path');
// file system
var fs = require('fs');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var mongoose = require('mongoose');
mongoose.connect('mongodb://0.0.0.0/dd_alpha', function (err) {
  if (err) {
    console.error("ERROR: Could not connect to database:\n" + err);
  }
});
// connect to db
var schemas = {},
    models = {};

schemas['user'] = mongoose.Schema({
  username: String,
  passwordHash: String,
  email: String
});

schemas['calendar'] = mongoose.Schema({
  'campaign': String,
  'era': String,
  'year': Number,
  'month': String,
  'week': String,
  'day': Number
});

models['user'] = mongoose.model('user', schemas['user']);
models['calendar'] = mongoose.model('calendar', schemas['calendar']);

var app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//// setup JWT authentication for specific routes
// before any of the back-end requests, we first check if we need to authenticate the user's JWT
// use on any path that has secured data
app.use([STATICS.routeEndpoints.secured], function (req, res, next) {
  var token;

  //// get the token
  // typically, we attempt to follow the Bearer scheme authorization header method,
  // if that isn't followed, attempt to extract the token by some other means.
  if (req.headers && req.headers["authorization"]) {
    token = req.headers["authorization"];
    // remove the Bearer phrase from the token
    if (token.indexOf("Bearer ") === 0) {
      token = token.substring("Bearer ".length);
    }
  }
  // images/videos cannot have authenticated headers, so instead look at the url
  else if (req.query && req.query.token) {
    // @TODO: Do we need to remove the token query from the URL?
    token = req.query.token;
  }
  // attempt to extract the token from other common means
  else {
    token = (req.body && req.body.token) || (req.headers && req.headers['x-access-token']);
  }
  
  // if there is no token, do not fulfill the request
  if (!token) {
    return res.status(403).send("No token given. Please attempt to log in.");
  }

  // verify the token is valid
  jwt.verify(token, jwtSecretKey, function(err, decoded) {
    if (err) {
      return res.status(403).send("Failed to authenticate JSON web token for a user. Please attempt to log in.");
    }

    // save the token payload and pass to next route
    req.jwtPayload = decoded;
    next();
  });
});

var calendarRoute = require('./routes/calendar/index')(app, models, STATICS, bodyParser);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(express.static(path.join(__dirname, '../ng-sr/index.html')));

  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

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