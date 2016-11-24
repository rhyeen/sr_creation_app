var express = require('express');

var path = require('path');
var logger = require('morgan');

var app = express();
app.use(logger('dev'));
app.set('view engine', 'jade');

var ngAppRootDir = path.join(__dirname, '../sr_creation_ng2/');

// serve static files
app.use(express.static(ngAppRootDir));

app.get('*', function(req, res) {
  res.sendFile(path.join(ngAppRootDir, 'index.html')); // load the single view file (angular will handle the page changes on the front-end)
});

module.exports = app;
