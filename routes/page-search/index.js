module.exports = function(app, STATICS, helpers, Promise, pool) {
  
  function getSearchResults(user_id, search_query, type, connection) {
    if (type === 'image') {
      return getImageSearchResults(user_id, search_query, type, connection);
    } else {
      return getPageSearchResults(user_id, search_query, type, connection);
    }
  }

  function getPageSearchResults(user_id, search_query, type, connection) {
    return new Promise(function(resolve, reject) {
      var i, properties;
      var query = "SELECT `page_summary`.`name` AS `name`, `page_summary`.`text` AS `text`, `page_summary`.`properties` AS `properties`, `page_summary`.`page_id` AS 'id' FROM `page_summary` INNER JOIN `page_auth` ON `page_summary`.`page_id` = `page_auth`.`page_id` WHERE `page_auth`.`user_id` = ? AND `page_auth`.`page_GET` = 1 AND `page_summary`.`type` = ? AND `page_summary`.`name` LIKE" + connection.escape('%' + search_query + '%');
      connection.query(query, [user_id, type], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        if (!rows || rows.length <= 0) {
          return resolve([]);
        }
        for (i = 0; i < rows.length; i++) {
          properties = rows[i]['properties'];
          if (properties) {
            properties = JSON.parse(properties);
          }
          rows[i]['properties'] = properties;
        }
        return resolve(rows);
      });
    });
  }

  function getImageSearchResults(user_id, search_query, type, connection) {
    return new Promise(function(resolve, reject) {
      var i, properties;
      var query = "SELECT `page_images`.`image_id` AS `id`, `page_images`.`name` AS `name`, `page_images`.`caption` AS `caption`, `page_images`.`link` AS `link`, `page_images`.`thumbnail_link` AS `thumbnail_link`, `page_images`.`source` AS `source` FROM `page_images` INNER JOIN `page_id_bind` ON `page_images`.`image_id` = `page_id_bind`.`bound_id` INNER JOIN `page_auth` ON `page_auth`.`page_id` = `page_id_bind`.`page_id` WHERE `page_auth`.`user_id` = ? AND `page_GET` = 1 AND `page_images`.`name` LIKE" + connection.escape('%' + search_query + '%');
      connection.query(query, [user_id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        if (!rows || rows.length <= 0) {
          return resolve([]);
        }
        return resolve(rows);
      });
    });
  }

  function responseWithError(error, res, connection, pool) {
    var status = 500;
    var message = error;
    if (connection && connectionNotReleased(connection, pool)) {
      connection.release();
    }
    if ('status' in error) {
      status = error['status'];
    }
    if ('message' in error) {
      message = error['message'];
    }
    res.status(status).send(message);
  }

  function connectionNotReleased(connection, pool) {
    return pool._freeConnections.indexOf(connection) == -1;
  }

  app.get(STATICS.routes.page_search, function(req, res) {
    var user_id = 'US_1234567890123';
    var search_query = req.query.query;
    var type = req.query.type;

    if (!search_query || !type) {
      res.send([]);
      return;
    }
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }
      getSearchResults(user_id, search_query, type, connection).then(function (results) {
        if (connection && connectionNotReleased(connection, pool)) {
          connection.release();
        }
        res.send(results);
      }, function(error) {
        responseWithError(error, res, connection, pool);
      });
    });
  });
};
