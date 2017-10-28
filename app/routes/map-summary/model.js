let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");
let manage_content = require("../../lib/services/manage-content");
let Promise = require("bluebird");

var exports = module.exports = {};

exports.updateMapSummary = function(page_id, map_id, map_name, summary_text, summary_properties) {
  try {
    if (summary_properties) {
      summary_properties = JSON.stringify(summary_properties);
    }
  } catch (err) {
    console.error("Could not stringify summary_properties: " + err);
    summary_properties = "[]";
  }
  let query = "UPDATE `page_summary` SET `name` = ?, `text` = ?, `properties` = ? WHERE `page_id` = ?";
  let params = [
    map_name,
    summary_text,
    summary_properties,
    page_id
  ];
  return manage_content.updateContent(page_id, query, params, map_id);
};
