let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");
let get_page_model = require("./get-page-model");
let delete_page_model = require("./delete-page-model");
let create_page_model = require("./create-page-model");
let update_page_model = require("./update-page-model");

let Promise = require("bluebird");

var exports = module.exports = {};

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
  });
};

exports.updateRelatedPagesOrder = function(pages, page_id) {
  return new Promise(function(resolve, reject) {
    update_page_model.updateRelatedPagesOrder(pages, page_id)
    .then(() => resolve(), error => reject(error));
  });
};

exports.getPage = function(page_id) {
  return new Promise(function(resolve, reject) {
    get_page_model.getPage(page_id).then(function(page) {
      return resolve(page);
    }, function(error) {
      return reject(error);
    });
  });
};

exports.deletePage = function(page_id) {
  return new Promise(function(resolve, reject) {
    delete_page_model.deletePage(page_id).then(function(data) {
      return resolve('Success');
    }, function(error) {
      return reject(error);
    });
  });
};

exports.createPage = function(link_id, page_type, page_name, user_id) {
  return new Promise(function(resolve, reject) {
    create_page_model.createPage(link_id, page_type, page_name, user_id).then(function(page_id) {
      return resolve(page_id);
    }, function(error) {
      return reject(error);
    });
  });
};