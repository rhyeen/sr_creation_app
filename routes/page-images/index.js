module.exports = function(app, STATICS, helpers, Promise, pool, jsonParser) {
  function updateImages(req, res, connection) {
    var body = req.body;
    var page_id = req.query.id;
    var page_images = body['images'];
    var content_type = 'IM';
    if (page_images) {
      page_images = JSON.stringify(page_images);
    }
    connection.query("UPDATE `page_content` SET `list` = ? WHERE `page_id` = ? AND `type` = ?", [page_images, page_id, content_type], function(err, rows, fields) {
      if (helpers.connection.queryError(err, connection)) {
        res.status(500).send('Query failed unexpectedly.');
        return;
      }
      res.send('Success');
      return;
    });
  }

  function verifyUserHasAccess(connection, page_id, user_id, request_method) {
    var page_id;
    var method_column = 'page_{0}'.format(request_method);
    var query = "SELECT `{0}` FROM `page_auth` WHERE `user_id` = ? AND `page_id` = ? AND `disabled` != 1  LIMIT 1".format(method_column);
    return new Promise(function(resolve, reject) {
      connection.query(query, [user_id, page_id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        if (rows.length <= 0) {
          return reject({
            status: 400,
            message: "User does not have permissions."
          });
        }

        return resolve();
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

  app.put(STATICS.routes.page_images, jsonParser, function(req, res) {
    var user_id = 'US_1234567890123';
    var page_id = req.query.id;
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }
      verifyUserHasAccess(connection, page_id, user_id, 'PUT').then(function(data) {
        updateImages(req, res, connection);
        if (connection && connectionNotReleased(connection, pool)) {
          connection.release();
        }
      }, function(error) {
        responseWithError(error, res, connection, pool);
      });
    });
  });

  app.post(STATICS.routes.page_images, jsonParser, function(req, res) {
    var user_id = 'US_1234567890123';
    var page_id = req.query.id;
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }
      verifyUserHasAccess(connection, page_id, user_id, 'POST').then(function(data) {
        updateImages(req, res, connection);
        if (connection && connectionNotReleased(connection, pool)) {
          connection.release();
        }
      }, function(error) {
        responseWithError(error, res, connection, pool);
      });
    });
  });
};
