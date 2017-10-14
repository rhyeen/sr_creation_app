let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");
let Promise = require("bluebird");

var exports = module.exports = {};

exports.updateRelatedPagesOrder = function(pages, page_id) {
  return new Promise(function(resolve, reject) {
    mysql.getConnection(function(err, connection) {
      if (mysql.connectionError(err, connection)) {
        return reject(mysql.connectionError(err, connection));
      }
      connection.beginTransaction(err => {
        if (err) {
          return reject(mysq.transactionError(err, connection));
        }
        removeCurrentRelatedPageOrder(connection, page_id).then(() => {
          addRelatedPageOrder(connection, page_id, pages).then(() => {
            connection.commit((err) => {
              if (err) {
                return reject(mysq.transactionError(err, connection));
              }
              mysql.forceConnectionRelease(connection);
              return resolve();
            });
          }, error => {
            connection.rollback(() => {
              mysql.forceConnectionRelease(connection);
              return reject(error);
            });
          }, error => {
            connection.rollback(() => {
              mysql.forceConnectionRelease(connection);
              return reject(error);
            });
          });
        });
      });
    });
  });
};


function removeCurrentRelatedPageOrder(connection, page_id) {
  return new Promise(function(resolve, reject) {
    let query = "DELETE FROM `page_links` WHERE `page_id` = ?";
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

function addRelatedPageOrder(connection, page_id, pages) {
  return new Promise(function(resolve, reject) {
    let query = "INSERT INTO `page_links` (`page_id`, `type`, `properties`, `order_index`) VALUES ?";
    let nested_params = [];
    for (let i = 0; i < pages.length; i++) {
      nested_params.push([
        page_id,
        pages[i]['type'],
        pages[i]['properties'],
        i
      ]);
    }
    let params = [
      nested_params
    ];
    connection.query(query, params, function (err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      return resolve();
    });
  });
}
