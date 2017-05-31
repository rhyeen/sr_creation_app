let mysql = require("./mysql-connection");

let exports = module.exports = {};

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
