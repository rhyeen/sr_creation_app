let mysql = require("mysql");
let constants = require("./constants").get();
let StatusError = require("./error/status-error");

let pool = null;

var exports = module.exports = {};

exports.getConnection = function(callback) {
  let connect = function(callback) {
    pool.getConnection(function (err, connection) {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, connection);
    });
  };

  if (pool) {
    connect(callback);
    return;
  }
  try {
    let port = constants.MYSQL_PORT;
    let host = process.env.DATABASE_HOST || constants.MYSQL_HOST;
    let database = constants.MYSQL_DATABASE;
    let user = constants.MYSQL_USER;
    let connection_limit = constants.MYSQL_CONNECTION_LIMIT;
    let password = constants.MYSQL_PASSWORD;
    pool = mysql.createPool({
      connectionLimit : connection_limit,
      port: port,
      host: host,
      user: user,
      password: password,
      database: database
    });
    connect(callback);
  } catch(error) {
    console.log(error);
    callback(error, null);
  }
};


exports.connectionNotReleased = function(connection) {
  return connection && pool._freeConnections.indexOf(connection) == -1;
};

exports.forceConnectionRelease = function(connection) {
  if (exports.connectionNotReleased(connection)) {
    connection.release();
  }
};

exports.connectionError = function(err, connection) {
  if (err) {
    console.error("ERROR: Connection could not be established.\n" + err);
    exports.forceConnectionRelease(connection);
    const message = "Could not connect to the database.";
    const error = "CONNECTION_ERROR";
    return new StatusError(message, 500, error);
  }
  return null;
};

exports.queryError = function(err, connection) {
  if (err) {
    console.error("ERROR: Query failed unexpectedly:\n" + err);
    exports.forceConnectionRelease(connection);
    const message = "Query failed unexpectedly.";
    const error = "QUERY_ERROR";
    return new StatusError(message, 500, error);
  }
  return null;
};

exports.transactionError = function(err, connection) {
  if (err) {
    console.error("ERROR: Query transaction failed unexpectedly:\n" + err);
    exports.forceConnectionRelease(connection);
    const message = "Query transaction failed unexpectedly.";
    const error = "QUERY_ERROR";
    return new StatusError(message, 500, error);
  }
  return null;
};