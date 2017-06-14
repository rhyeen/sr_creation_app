let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");

let Promise = require("bluebird");

var exports = module.exports = {};

exports.getSearchResults = function(user_id, search_query, search_type) {
  if (search_type === 'image') {
    return getImageSearchResults(user_id, search_query, search_type);
  } else {
    return getPageSearchResults(user_id, search_query, search_type);
  }
};

function getPageSearchResults(user_id, search_query, type) {
  return new Promise(function(resolve, reject) {
    mysql.getConnection(function(err, connection) {
      if (mysql.connectionError(err, connection)) {
        return reject(mysql.connectionError(err, connection));
      }
      let query = "SELECT `page_summary`.`name` AS `name`, `page_summary`.`text` AS `text`, `page_summary`.`properties` AS `properties`, `page_summary`.`page_id` AS 'id' FROM `page_summary` INNER JOIN `page_auth` ON `page_summary`.`page_id` = `page_auth`.`page_id` WHERE `page_auth`.`user_id` = ? AND `page_auth`.`page_GET` = 1 AND `page_summary`.`type` = ? AND `page_summary`.`name` LIKE" + connection.escape('%' + search_query + '%');
      let params = [
        user_id,
        type
      ];
      connection.query(query, params, function(err, rows, fields) {
        if (mysql.queryError(err, connection)) {
          return reject(mysql.queryError(err, connection));
        }
        if (!rows || rows.length <= 0) {
          mysql.forceConnectionRelease(connection);
          return resolve([]);
        }
        for (let i = 0; i < rows.length; i++) {
          let properties = rows[i]['properties'];
          if (properties) {
            properties = JSON.parse(properties);
          }
          rows[i]['properties'] = properties;
        }
        mysql.forceConnectionRelease(connection);
        return resolve(rows);
      });
    });
  });
}

function getImageSearchResults(user_id, search_query, type) {
  return new Promise(function(resolve, reject) {
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
