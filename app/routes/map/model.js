let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");
let Promise = require("bluebird");

var exports = module.exports = {};

exports.getMaps = function(page_id) {
  return new Promise(function(resolve, reject) {
    resolve({
      maps: [
        {
          key: 'value'
        }
      ]
    });
  });
};

