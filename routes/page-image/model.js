let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");
let manage_content = require("../../lib/services/manage-content");

var exports = module.exports = {};

exports.addImage = function(page_id, image_name, image_caption, image_source, image_link, thumbnail_link) {
  let query = "INSERT INTO `page_images` (`image_id`, `name`, `link`, `thumbnail_link`, `caption`, `source`) VALUES (?, ?, ?, ?, ?, ?)";
  let params = [
    null,
    image_name,
    image_link,
    thumbnail_link,
    image_caption,
    image_source
  ];
  return manage_content.addContent(page_id, query, params, 0, 'page_images', 'image_id', 'IM');
};

exports.updateImage = function(page_id, image_id, image_name, image_caption, image_source, image_link, thumbnail_link) {
  let query = "UPDATE `page_images` SET `name` = ?, `caption` = ?, `link` = ?, `thumbnail_link` = ?, `source` = ? WHERE `image_id` = ?";
  let params = [
    image_name,
    image_caption,
    image_link,
    thumbnail_link,
    image_source,
    image_id
  ];
  return manage_content.updateContent(page_id, query, params, image_id);
};

exports.disableImage = function(page_id, image_id) {
  return manage_content.disableContent(page_id, image_id);
};
