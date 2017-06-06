let mysql = require("./mysql-connection");
let constants = require("./constants").get();

var exports = module.exports = {};

exports.responseWithError = function(error, res, connection) {
    let status = 500;
    let message = error;
    let error_id = null;
    mysql.forceConnectionRelease(connection);
    if ("status" in error) {
        status = error["status"];
    }
    if ("message" in error) {
        message = error["message"];
    }
    if ("error" in error) {
        error_id = error["error"];
    }
    if (status === 500) {
      console.error(message);
    }
    if (error_id) {
        res.status(status).json({
            error: error_id,
            message: message
        });
        return;
    }
    res.status(status).json({
        error: message
    });
};

exports.generateId = function(id_starter) {
  if (id_starter) {
    id_starter = id_starter + '_';
  } else {
    id_starter = '';
  }
  let id_size = 16 - id_starter.length;
  let i;
  let hash = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(i = 0; i < id_size; i++) {
    hash += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return id_starter + hash;
};

exports.getUniqueId = function(id_starter, table, identifier) {
  let attempts = 0;
  return new Promise(function(resolve, reject) {
    mysql.getConnection(function(err, connection) {
      if (mysql.connectionError(err, connection)) {
        return reject(mysql.connectionError(err, connection));
      }
      return resolve(recurseGetUniqueId(connection, id_starter, table, identifier, attempts));
    });
  });
};

function recurseGetUniqueId(connection, id_starter, table, identifier, attempts) {
  let max_attempts = constants.MAX_ID_GENERATION_RETRIES;
  return new Promise(function(resolve, reject) {
      let unique_id = exports.generateId(id_starter);
      let query = "SELECT * FROM `" + table + "` WHERE `" + identifier + "` = ? LIMIT 1";
      let params = [
        unique_id
      ];
      connection.query(query, params, function(err, rows, fields) {
        if (mysql.queryError(err, connection)) {
          return reject(mysql.queryError(err, connection));
        }
        if (rows.length <= 0) {
          mysql.forceConnectionRelease(connection);
          return resolve(unique_id);
        }
        attempts += 1;
        if (attempts >= max_attempts) {
          mysql.forceConnectionRelease(connection);
          return reject({
            status: 500,
            message: `Attempted to find a unique id ${max_attempts} times without success.`
          });
        }
        return resolve(recurseGetUniqueId(connection, id_starter, table, identifier, attempts));
      });
    });
}