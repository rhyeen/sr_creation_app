const CONSTANTS = {
  "PAGE_ID_LENGTH": 16,
  "MAX_ID_GENERATION_RETRIES": 10,
  "MYSQL_PORT": 3306,
  "MYSQL_USER": "sr_creation_dev",
  "MYSQL_HOST": "127.0.0.1",
  "MYSQL_DATABASE": "sr_creation_dev",
  "MYSQL_PASSWORD": "password",
  "MYSQL_CONNECTION_LIMIT": 20
};

var exports = module.exports = {};

exports.get = function(id) {
  var id_str = id;
  if (!(id in CONSTANTS)) {
    throw new Error(`Constant: ${id_str} not found.`);
  }
  return CONSTANTS[id];
};
 