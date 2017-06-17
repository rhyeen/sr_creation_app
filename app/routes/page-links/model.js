let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");

let Promise = require("bluebird");

var exports = module.exports = {};

exports.updatePageLinks = function(page_id, page_links) {
  return new Promise(function(resolve, reject) {
    console.log('here');
    console.log(page_links);
    let page_type = getPageType(page_links);
    if (!page_type) {
      return reject({
        message: "Unsupported list: make sure all ids are of the same type and the id type is valid"
      });
    }
    mysql.getConnection(function(err, connection) {
      if (mysql.connectionError(err, connection)) {
        return reject(mysql.connectionError(err, connection));
      }
      let update_order_calls = [];
      for (let i = 0; i < page_links.length; i++) {
        update_order_calls.push(updateOrder(connection, page_id, page_links[i], page_type, i));
      }
      Promise.all(update_order_calls).then(function() {
        mysql.forceConnectionRelease(connection);
        return resolve();
      }, function(error) {
        return reject(error);
      });
    });
  });
};

function updateOrder(connection, page_id, link_id, page_type, index) {
  return new Promise(function(resolve, reject) {
    let query = "INSERT INTO `page_id_bind` (`order`, `page_id`, `bound_id`, `type`) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE `order` = ?";
    let params = [
      index,
      page_id,
      link_id,
      page_type,
      index,
      page_id,
      link_id
    ];
    console.log('here2');
    console.log(page_id);
    console.log(link_id);
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      return resolve();
    });
  });
}

function getPageType(page_links) {
  var i, page_type, last_page_type;
  for (i = 0; i < page_links.length; i++) {
    page_type = extractPageType(page_links[i]);
    if (!page_type) {
      return null;
    }
    if (last_page_type) {
      if (last_page_type != page_type) {
        return null;
      }
    }
    last_page_type = page_type;
  }
  return page_type;
}

function extractPageType(page_link) {
  if (!page_link || page_link.length < 16) {
    return null;
  }
  return page_link.substring(0, 2);
}
