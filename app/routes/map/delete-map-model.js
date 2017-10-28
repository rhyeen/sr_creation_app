let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");
let manage_content = require("../../lib/services/manage-content");
let Promise = require("bluebird");

var exports = module.exports = {};

exports.deleteMap = function(page_id, map_id) {
  return manage_content.disableContent(page_id, map_id);
};