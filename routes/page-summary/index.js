module.exports = function(app, STATICS, helpers, Promise, pool, jsonParser) {
  function updatePageSummary(req, res, connection) {
    var body = req.body;
    var page_id = req.query.id;
    var page_name = body['name'];
    var page_summary = body['summary'];
    var summary_text = page_summary['text'];
    var summary_properties = page_summary['properties'];
    if (summary_properties) {
      summary_properties = JSON.stringify(summary_properties);
    }
 
    connection.query("UPDATE `page_summary` SET `name` = ?, `text` = ?, `properties` = ? WHERE `page_id` = ?", [page_name, summary_text, summary_properties, page_id], function(err, rows, fields) {
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

  function verifyUserHasAccess(connection, page_id, user_id, request_method) {
    var page_id;
    var method_column = 'page_{0}'.format(request_method);
    var query = "SELECT `{0}` FROM `page_auth` WHERE `user_id` = ? AND `page_id` = ? AND `disabled` != 1 LIMIT 1".format(method_column);
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

  app.put(STATICS.routes.page_summary, jsonParser, function(req, res) {
    var user_id = 'US_1234567890123';
    var page_id = req.query.id;
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }
      verifyUserHasAccess(connection, page_id, user_id, 'PUT').then(function(data) {
        updatePageSummary(req, res, connection);
      }, function(error) {
        responseWithError(error, res);
      });
    });
  });

  app.post(STATICS.routes.page_summary, jsonParser, function(req, res) {
    var user_id = 'US_1234567890123';
    var page_id = req.query.id;
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }
      verifyUserHasAccess(connection, page_id, user_id, 'POST').then(function(data) {
        updatePageSummary(req, res, connection);
      }, function(error) {
        responseWithError(error, res);
      });
    });
  });
};
