module.exports = function(app, STATICS, helpers, Promise, pool, jsonParser) {
  function updatePageLinks(req, res, connection) {
    var body = req.body;
    var page_id = req.query.id;
    var page_links = body['links'];
    var page_type = validatePageType(page_links);
    if (!page_type) {
      res.status(500).send('Unsupported list: make sure all ids are of the same type and the id type is valid');
      if (connection) {
        connection.release();
      }
      return;
    }
    if (page_links) {
      page_links = JSON.stringify(page_links);
    }
 
    connection.query("UPDATE `page_links` SET `list` = ? WHERE `page_id` = ? AND `type` = ?", [page_links, page_id, page_type], function(err, rows, fields) {
      if (helpers.connection.queryError(err, connection)) {
        res.status(500).send('Query failed unexpectedly.');
        if (connection) {
          connection.release();
        }
        return;
      }
      res.send('Success');
      return;
    });
  }

  function validatePageType(page_links) {
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

  function verifyUserHasAccess(connection, page_id, user_id, request_method) {
    var page_id;
    var method_column = 'page_{0}'.format(request_method);
    var query = "SELECT `{0}` FROM `page_auth` WHERE `user_id` = ? AND `page_id` = ?  `disabled` != 1  LIMIT 1".format(method_column);
    return new Promise(function(resolve, reject) {
      connection.query(query, [user_id, page_id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        if (rows.length <= 0) {
          if (connection) {
            connection.release();
          }
          return reject({
            status: 400,
            message: "User does not have permissions."
          });
        }

        return resolve();
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

  app.put(STATICS.routes.page_links, jsonParser, function(req, res) {
    var user_id = 'US_1234567890123';
    var page_id = req.query.id;
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }
      verifyUserHasAccess(connection, page_id, user_id, 'PUT').then(function(data) {
        updatePageLinks(req, res, connection);
      }, function(error) {
        responseWithError(error, res);
      });
    });
  });

  app.post(STATICS.routes.page_links, jsonParser, function(req, res) {
    var user_id = 'US_1234567890123';
    var page_id = req.query.id;
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }
      verifyUserHasAccess(connection, page_id, user_id, 'POST').then(function(data) {
        updatePageLinks(req, res, connection);
      }, function(error) {
        responseWithError(error, res);
      });
    });
  });
};
