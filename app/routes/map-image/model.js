let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");
let manage_content = require("../../lib/services/manage-content");

var exports = module.exports = {};

/**
 * @NOTE: The reason that Map-images are different than page images, is that map-images are specifically the single image tied to a map as the map's background.  A map may (in the future) also have normal page images, which can be added via the page-image call.
 */

exports.addImage = function(map_id, image_name, image_caption, image_source, image_link, thumbnail_link) {
  let query = "INSERT INTO `map_images` (`image_id`, `name`, `link`, `thumbnail_link`, `caption`, `source`) VALUES (?, ?, ?, ?, ?, ?)";
  let params = [
    null,
    image_name,
    image_link,
    thumbnail_link,
    image_caption,
    image_source
  ];
  return manage_content.addContent(map_id, query, params, 0, 'page_images', 'image_id', 'MI');
};

exports.updateImage = function(map_id, image_id, image_name, image_caption, image_source, image_link, thumbnail_link) {
  let query = "UPDATE `map_images` SET `name` = ?, `caption` = ?, `link` = ?, `thumbnail_link` = ?, `source` = ? WHERE `image_id` = ?";
  let params = [
    image_name,
    image_caption,
    image_link,
    thumbnail_link,
    image_source,
    image_id
  ];
  return manage_content.updateContent(map_id, query, params, image_id);
};

exports.deleteImageLink = function(map_id, image_id) {
  return manage_content.disableContent(map_id, image_id);
};
