let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");
let Promise = require("bluebird");

var exports = module.exports = {};

exports.deletePage = function(page_id) {
  return new Promise(function(resolve, reject) {
    mysql.getConnection(function(err, connection) {
      if (mysql.connectionError(err, connection)) {
        return reject(mysql.connectionError(err, connection));
      }
      disablePage(connection, page_id).then(function(data) {
        disablePageIdFromLinks(connection, page_id).then(function(data) {
          mysql.forceConnectionRelease(connection);
          return resolve();
        }, function(error) {
          mysql.forceConnectionRelease(connection);
          return reject(error);
        });
      }, function(error) {
        mysql.forceConnectionRelease(connection);
        return reject(error);
      });
    });
  });
};


function disablePage(connection, page_id) {
  return new Promise(function(resolve, reject) {
    let query = "UPDATE `page_auth` SET `disabled` = 1 WHERE `page_id` = ?";
    let params = [
      page_id
    ];
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      return resolve();
    });
  });
}

function disablePageIdFromLinks(connection, page_id) {
  return new Promise(function(resolve, reject) {
    let query = "UPDATE `page_id_bind` SET `disabled` = 1 WHERE `bound_id` = ?";
    let params = [
      page_id
    ];
    connection.query(query, params, function (err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      return resolve();
    });
  });
}
