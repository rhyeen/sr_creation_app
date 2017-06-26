let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");

let Promise = require("bluebird");

var exports = module.exports = {};

exports.getSearchResults = function(user_id, search_query) {
  return getMapImageSearchResults(user_id, search_query);
};

function getMapImageSearchResults(user_id, search_query) {
  return new Promise(function(resolve, reject) {
    return resolve([{'name': 'Need to update query for map images later'}]);
    mysql.getConnection(function(err, connection) {
      if (mysql.connectionError(err, connection)) {
        return reject(mysql.connectionError(err, connection));
      }
      let query = "SELECT `page_images`.`image_id` AS `id`, `page_images`.`name` AS `name`, `page_images`.`caption` AS `caption`, `page_images`.`link` AS `link`, `page_images`.`thumbnail_link` AS `thumbnail_link`, `page_images`.`source` AS `source` FROM `page_images` INNER JOIN `page_id_bind` ON `page_images`.`image_id` = `page_id_bind`.`bound_id` INNER JOIN `page_auth` ON `page_auth`.`page_id` = `page_id_bind`.`page_id` WHERE `page_auth`.`user_id` = ? AND `page_GET` = 1 AND `page_images`.`name` LIKE" + connection.escape('%' + search_query + '%');
      let params = [
        user_id
      ];
      connection.query(query, params, function(err, rows, fields) {
        if (mysql.queryError(err, connection)) {
          return reject(mysql.queryError(err, connection));
        }
        if (!rows || rows.length <= 0) {
          mysql.forceConnectionRelease(connection);
          return resolve([]);
        }
        for (let row of rows) {
          row['thumbnail'] = {
            'link': row['thumbnail_link']
          };
          delete row['thumbnail_link'];
        }
        mysql.forceConnectionRelease(connection);
        return resolve(rows);
      });
    });
  });
}
