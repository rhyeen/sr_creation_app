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
        removePageIdFromLinks(connection, page_id).then(function(data) {
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
      return resolve('Success');
    });
  });
}

function removePageIdFromLinks(connection, page_id) {
  return new Promise(function(resolve, reject) {
    connection.beginTransaction(function(err) {
      if (err) {
        return connection.rollback(function() {
          return reject(mysql.queryError(err, connection));
        });
      }
      // @TODO: finish later
      // connection.query('UPDATE `page_id_bind` SET `order` = `order` - 1 WHERE `page_id` = ? AND `type` = "DE" AND `order` > (SELECT `order` FROM (SELECT `order` FROM `page_id_bind` WHERE `page_id` = ? AND `bound_id` = ?) AS `temp`)', [page_id, page_id, detail_id], function (err, rows, fields) {
      //   if (err) {
      //     return connection.rollback(function() {
      //       helpers.connection.queryError(err, connection);
      //       res.status(500).send('Query failed unexpectedly.');
      //     });
      //   }
      //   connection.query('DELETE FROM `page_id_bind` WHERE `page_id` = ? AND `bound_id` = ?', [page_id, detail_id], function (err, rows, fields) {
      //     if (err) {
      //       return connection.rollback(function() {
      //         helpers.connection.queryError(err, connection);
      //         res.status(500).send('Query failed unexpectedly.');
      //       });
      //     }
      //     connection.commit(function(err) {
      //       if (err) {
      //         return connection.rollback(function() {
      //           helpers.connection.queryError(err, connection);
      //           res.status(500).send('Query failed unexpectedly.');
      //         });
      //       }
      //       res.send('Success');
      //     });
      //     });
      //   });
      });
    });
  }

