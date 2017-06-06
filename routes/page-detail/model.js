let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");
let manage_content = require("../../lib/services/manage-content");

var exports = module.exports = {};

exports.addDetail = function(page_id, detail_name, content_mark_down, content_partitions) {
  try {
    if (content_partitions) {
      content_partitions = JSON.stringify(content_partitions);
    }
  } catch (err) {
    console.error("Could not stringify content_partitions: " + err);
    content_partitions = "[]";
  }
  let query = "INSERT INTO `page_details` (`detail_id`, `name`, `content_mark_down`, `content_partitions`) VALUES (?, ?, ?, ?)";
  let params = [
    null,
    detail_name,
    content_mark_down,
    content_partitions
  ];
  return manage_content.addContent(page_id, query, params, 0, 'page_details', 'detail_id', 'DE');
};

exports.updateDetail = function(page_id, detail_id, detail_name, content_mark_down, content_partitions) {
  try {
    if (content_partitions) {
      content_partitions = JSON.stringify(content_partitions);
    }
  } catch (err) {
    console.error("Could not stringify content_partitions: " + err);
    content_partitions = "[]";
  }
  let query = "UPDATE `page_details` SET `name` = ?, `content_mark_down` = ?, `content_partitions` = ? WHERE `detail_id` = ?";
  let params = [
    detail_name,
    content_mark_down,
    content_partitions,
    detail_id
  ];
  return manage_content.updateContent(page_id, query, params, detail_id);
};

exports.disableDetail = function(page_id, detail_id) {
  return manage_content.disableContent(page_id, detail_id);
};
