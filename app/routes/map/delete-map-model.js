let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");
let Promise = require("bluebird");

var exports = module.exports = {};

exports.deleteMap = function(page_id) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
};