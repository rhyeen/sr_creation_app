let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");
let manage_content = require("../../lib/services/manage-content");
let Promise = require("bluebird");

var exports = module.exports = {};

exports.createMap = function(page_id, map) {
  let name = null;
  let properties = null;
  let text = null;
  if (map) {
    name = map['name'];
    if ('summary' in  map) {
      properties = map['summary']['properties'];
      try {
        properties = JSON.stringify(properties);
      } catch (err) {
        console.error("Could not stringify map.summary.properties: " + err);
        properties = null;
      }
      text = map['summary']['text'];
    }
  }
  let query = "INSERT INTO `maps` VALUES (`map_id`, `name`, `properties`, `text`) VALUES (?, ?, ?, ?)";
  let params = [
    null,
    name,
    properties,
    text
  ];
  return manage_content.addContent(page_id, query, params, 0, 'maps', 'maps_id', 'MP');
};
