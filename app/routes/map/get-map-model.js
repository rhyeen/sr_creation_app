let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");
let Promise = require("bluebird");

var exports = module.exports = {};

exports.getMap = function(map_id) {
  return new Promise(function(resolve, reject) {
    const map = {
      id: map_id
    };
    mysql.getConnection(function(err, connection) {
      if (mysql.connectionError(err, connection)) {
        return reject(mysql.connectionError(err, connection));
      }
      setMapProperties(connection, map).then(function() {
        setMapImage(connection, map).then(function() {
          setMapHighlightedPin(connection, map).then(function() {
            setMapPins(connection, map).then(function() {
              mysql.forceConnectionRelease(connection);
              return resolve(map);
            }, function(error) {
              mysql.forceConnectionRelease(connection);
              return reject(error);
            });
          }, function(error) {
            mysql.forceConnectionRelease(connection);
            return reject(error);
          });
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

function setMapProperties(connection, map) {
  const map_id = getMapId(map);
  return new Promise(function(resolve, reject) {
    let query = "SELECT `name`, `properties`, `text` FROM `page_maps` WHERE `map_id` = ? LIMIT 1";
    let params = [
      map_id
    ];
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      if (!rows || rows.length <= 0) {
        return reject({
          status: 400,
          message: `Unknown Map id: ${map_id}`
        });
      }
      const row = rows[0];
      map['name'] = row['name'];
      map['summary'] = {
        properties: JSON.parse(row['properties']),
        text: row['text']
      };
      return resolve();
    });
  });
}

function setMapImage(connection, map) {
  const map_id = getMapId(map);
  return new Promise(function(resolve, reject) {
    let query = "SELECT b.`image_id`, b.`name`, b.`caption`, b.`link`, b.`thumbnail_link`, b.`source` FROM (SELECT `bound_id` FROM `page_id_bind` WHERE `page_id` = ? AND `type` = 'MI') AS a LEFT JOIN `map_images` AS b ON b.`image_id` = a.`bound_id` LIMIT 1";
    let params = [
      map_id
    ];
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      const row = rows[0] || {};
      map['image'] = {
        id: row['image_id'] || null,
        name: row['name'] || null,
        caption: row['caption'] || null,
        source: row['source'] || null,
        link: row['link'] || null,
        thumbnail: {
          link: row['thumbnail_link'] || null
        }
      };
      return resolve();
    });
  });
}

function setMapHighlightedPin(connection, map) {
  const map_id = getMapId(map);
  return new Promise(function(resolve, reject) {
    let query = "SELECT `pin_id` FROM `map_highlighted_pin` WHERE `map_id` = ? LIMIT 1";
    let params = [
      map_id
    ];
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      if (!('pins' in map)) {
        map['pins'] = {};
      }      
      const row = rows[0] || {};
      map['pins']['highlighted'] = {
        id: row['pin_id'] || null
      };
      return resolve();
    });
  });
}

function setMapPins(connection, map) {
  const map_id = getMapId(map);
  return new Promise(function(resolve, reject) {
    let query = "SELECT m.`pin_id`, m.`page_id` AS `page_id`, m.`title`, m.`tooltip`, m.`icon`, m.`coordinates_x`, m.`coordinates_y`, p.`name` AS `page_name` FROM `map_pins` AS m LEFT JOIN `page_summary` AS p ON m.`map_id` = ? AND m.`page_id` = p.`page_id`";
    let params = [
      map_id
    ];
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      if (!('pins' in map)) {
        map['pins'] = {};
      }
      map['pins']['pin_ids'] = {};
      rows.forEach(row => {
        map['pins']['pin_ids'][row['pin_id']] = {
          title: {
            name: row['title']
          },
          tooltip: {
            text: row['tooltip']
          },
          link: {
            id: row['page_id'],
            name: row['page_name']
          },
          icon: {
            id: row['icon']
          },
          coordinates: {
            x: row['coordinates_x'],
            y: row['coordinates_y']
          }
        };
      });
      return resolve();
    });
  });
}

function getMapId(map) {
  return map.id;
}