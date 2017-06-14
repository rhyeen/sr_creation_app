let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");

let Promise = require("bluebird");

var exports = module.exports = {};

exports.updatePageSummary = function(page_id, page_name, summary_text, summary_properties) {
  return new Promise(function(resolve, reject) {
    try {
      if (summary_properties) {
        summary_properties = JSON.stringify(summary_properties);
      }
    } catch (err) {
      console.error("Could not stringify summary_properties: " + err);
      summary_properties = "[]";
    }
    mysql.getConnection(function(err, connection) {
      if (mysql.connectionError(err, connection)) {
        return reject(mysql.connectionError(err, connection));
      }
      let query = "UPDATE `page_summary` SET `name` = ?, `text` = ?, `properties` = ? WHERE `page_id` = ?";
      let params = [
        page_name,
        summary_text,
        summary_properties,
        page_id
      ];
      connection.query(query, params, function(err, rows, fields) {
        if (mysql.queryError(err, connection)) {
          return reject(mysql.queryError(err, connection));
        }
        return resolve();
      });
    });
  });
};
