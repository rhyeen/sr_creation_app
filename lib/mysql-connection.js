let mysql = require("mysql");
let constants = require("./constants");

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
    let port = constants.get("MYSQL_PORT");
    let host = constants.get("MYSQL_HOST");
    let database = constants.get("MYSQL_DATABASE");
    let user = constants.get("MYSQL_USER");
    let connection_limit = constants.get("MYSQL_CONNECTION_LIMIT");
    let password = constants.get("MYSQL_PASSWORD");
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
    return {
      status: 500,
      error: "CONNECTION_ERROR",
      message: "Could not connect to the database."
    };
  }
  return null;
};

exports.queryError = function(err, connection) {
  if (err) {
    console.error("ERROR: Query failed unexpectedly:\n" + err);
    exports.forceConnectionRelease(connection);
    return {
      status: 500,
      error: "QUERY_ERROR",
      message: "Query failed unexpectedly"
    };
  }
  return null;
};