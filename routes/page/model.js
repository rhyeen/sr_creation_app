let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");
let get_page_model = require("./get-page-model");

let Promise = require("bluebird");

let exports = module.exports = {};

exports.forceGetPageId = function(page_id, user_id) {
  return new Promise(function(resolve, reject) {
    if (page_id) {
      return resolve(page_id);
    }
    mysql.getConnection(function(err, connection) {
      if (mysql.connectionError(err, connection)) {
        return reject(mysql.connectionError(err, connection));
      }
      let query = "SELECT `page_id` FROM `page_home` WHERE `user_id` = ? LIMIT 1";
      let params = [
        user_id
      ];
      connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      mysql.forceConnectionRelease(connection);
      if (rows.length <= 0) {
        return reject({
          status: 400,
          message: "User does not have a home page."
        });
      }
      return resolve(rows[0]['page_id']);
    });
  });
};

exports.getPage = function(page_id) {
  get_page_model.getPage(page_id).then(function(page) {
    return resolve(page);
  }, function(error) {
    return reject(error);
  });
};