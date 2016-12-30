module.exports = function(app, STATICS, helpers, Promise, pool) {
  
  function getSearchResults(user_id, search_query, type, connection) {
    return new Promise(function(resolve, reject) {
      var i, properties;
      var query = "SELECT `name`, `text`, `properties`, `page_summary`.`page_id` AS 'id' FROM `page_summary` JOIN `page_auth` ON `page_summary`.`page_id` = `page_auth`.`page_id` WHERE `user_id` = ? AND `page_GET` = 1 AND `type` = ? AND `name` LIKE" + connection.escape('%' + search_query + '%');
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

  function responseWithError(error, res) {
    var status = 500;
    var message = error;
    if ('status' in error) {
      status = error['status'];
    }
    if ('message' in error) {
      message = error['message'];
    }
    res.status(status).send(message);
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
        res.send(results);
      }, function(error) {
        responseWithError(error, res);
      });
    });
  });
};
