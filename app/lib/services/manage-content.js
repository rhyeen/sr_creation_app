let tools = require("../tools");
let mysql = require("../mysql-connection");

let Promise = require("bluebird");

var exports = module.exports = {};

exports.addContent = function(page_id, content_insert_query, content_insert_params, content_id_params_index, content_table, content_identifier, content_type) {
  return new Promise(function(resolve, reject) {
    mysql.getConnection(function(err, connection) {
      if (mysql.connectionError(err, connection)) {
        return reject(mysql.connectionError(err, connection));
      }
      tools.getUniqueId(content_type, content_table, content_identifier).then(function(content_id) {
        content_insert_params[content_id_params_index] = content_id;
        let query = connection.query(content_insert_query, content_insert_params, function(err, result, fields) {
          if (mysql.queryError(err, connection)) {
            return reject(mysql.queryError(err, connection));
          }
          let query = "INSERT INTO `page_id_bind` (`page_id`, `bound_id`, `type`, `order`) SELECT ?, ?, ?, CASE WHEN MAX(`order`) IS NULL THEN 0 ELSE MAX(`order`) + 1 END AS `order` FROM `page_id_bind` WHERE `page_id` = ? AND type = ?";
          let params = [
            page_id,
            content_id,
            content_type,
            page_id,
            content_type
          ];
          connection.query(query, params, function(err, result, fields) {
            if (mysql.queryError(err, connection)) {
              return reject(mysql.queryError(err, connection));
            }
            mysql.forceConnectionRelease(connection);
            return resolve(content_id);
          });
        });
        // console.log(query.sql);
      }, function(error) {
        mysql.forceConnectionRelease(connection);
        return reject(error);
      });
    });
  });
};

exports.updateContent = function(page_id, content_update_query, content_update_params, content_id) {
  return new Promise(function(resolve, reject) {
    mysql.getConnection(function(err, connection) {
      if (mysql.connectionError(err, connection)) {
        return reject(mysql.connectionError(err, connection));
      }
      // we first need to verify that the content is actually associated with the given page_id, as the user may have maliciously given a page_id they have access over to manipulate an unassociated content.
      let query = "SELECT 1 FROM `page_id_bind` WHERE `page_id` = ? AND `bound_id` = ?";
      let params = [
        page_id,
        content_id
      ];
      connection.query(query, params, function(err, rows, fields) {
        if (mysql.queryError(err, connection)) {
          return reject(mysql.queryError(err, connection));
        }
        if (!rows || rows.length <= 0) {
          mysql.forceConnectionRelease(connection);
          return reject({
            status: 400,
            message: `Page id ${page_id} not associated with ${content_id}.`
          });
        }
        connection.query(content_update_query, content_update_params, function(err, result, fields) {
          if (mysql.queryError(err, connection)) {
            return reject(mysql.queryError(err, connection));
          }
          mysql.forceConnectionRelease(connection);
          return resolve();
        });
      });
    });
  });
};

/**
 * Only disables the content from that page.  Does not disable the content for all pages.
 */
exports.disableContent = function(page_id, content_id) {
  return new Promise(function(resolve, reject) {
    mysql.getConnection(function(err, connection) {
      if (mysql.connectionError(err, connection)) {
        return reject(mysql.connectionError(err, connection));
      }
      let query = "UPDATE `page_id_bind` SET `disabled` = 1 WHERE `bound_id` = ? AND `page_id` = ?";
      let params = [
        content_id,
        page_id
      ];
      connection.query(query, params, function(err, result, fields) {
        if (mysql.queryError(err, connection)) {
          return reject(mysql.queryError(err, connection));
        }
        mysql.forceConnectionRelease(connection);
        return resolve();
      });
    });
  });
};
