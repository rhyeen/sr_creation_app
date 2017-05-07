module.exports = function(app, STATICS, helpers, Promise, pool, jsonParser) {
  function updateDetail(req, res, connection) {
    var body = req.body;
    var page_id = req.query.id;
    var detail_id = req.query.detail;
    var detail_name = body['name'];
    var detail_content = body['content'];
    var content_mark_down = detail_content['mark_down'];
    var content_partitions = detail_content['partitions'];
    if (content_partitions) {
      content_partitions = JSON.stringify(content_partitions);
    }
    
    // we first need to verify that the detail is actually associated with the given page_id, as the user may have maliciously given a page_id they have access over to manipulate an unassociated detail.
    var query = "SELECT 1 FROM `page_id_bind` WHERE `page_id` = ? AND `bound_id` = ?";
    connection.query(query, [page_id, detail_id], function(err, rows, fields) {
      if (helpers.connection.queryError(err, connection)) {
        res.status(500).send('Query failed unexpectedly.');
        return;
      }
      if (!rows || rows.length <= 0) {
        res.status(400).send("Page id {0} not associated with {1}.".format(page_id, detail_id));
        return;
      }
      connection.query("UPDATE `page_details` SET `name` = ?, `content_mark_down` = ?, `content_partitions` = ? WHERE `detail_id` = ?", [detail_name, content_mark_down, content_partitions, detail_id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          res.status(500).send('Query failed unexpectedly.');
          return;
        }
        res.send('Success');
        return;
      });
    });
  }

  function addDetail(req, res, connection, pool) {
    var detail_list = [];
    var page_id = req.query.id;
    var detail_type = 'DE';
    var detail_table = 'page_details';
    var identifier = 'detail_id';
    var body = req.body;
    var detail_name = body['name'];
    var detail_content = body['content'];
    var content_mark_down = detail_content['mark_down'];
    var content_partitions = detail_content['partitions'];
    if (content_partitions) {
      content_partitions = JSON.stringify(content_partitions);
    }

    getUniqueId(connection, detail_type, detail_table, identifier).then(function(detail_id) {
      connection.query("INSERT INTO `page_details` (`detail_id`, `name`, `content_mark_down`, `content_partitions`) VALUES (?, ?, ?, ?)", [detail_id, detail_name, content_mark_down, content_partitions], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          res.status(500).send('Query failed unexpectedly.');
          return;
        }

        connection.query("INSERT INTO `page_id_bind` (`page_id`, `bound_id`, `type`, `order`) SELECT ?, ?, ?, MAX(`order`) + 1 AS `order` FROM `page_id_bind` WHERE `page_id` = ? AND type = ?", [page_id, detail_id, detail_type, page_id, detail_type], function(err, rows, fields) {
          if (helpers.connection.queryError(err, connection)) {
            res.status(500).send('Query failed unexpectedly.');
            return;
          }
          res.send(detail_id);
          return;
        });
      });
    }, function(error) {
      responseWithError(error, res, connection, pool);
    });
  }

  /**
   * Will only remove the binding of the detail to the page.
   * The detail will still remain: we don't delete data.
   */
  function deleteDetail(req, res, connection, pool) {
    var page_id = req.query.id;
    var detail_id = req.query.detail;
    connection.beginTransaction(function(err) {
      if (err) {
        return connection.rollback(function() {
          helpers.connection.queryError(err, connection);
          res.status(500).send('Query failed unexpectedly.');
        });
      }
      connection.query('UPDATE `page_id_bind` SET `order` = `order` - 1 WHERE `page_id` = ? AND `type` = "DE" AND `order` > (SELECT `order` FROM (SELECT `order` FROM `page_id_bind` WHERE `page_id` = ? AND `bound_id` = ?) AS `temp`)', [page_id, page_id, detail_id], function (err, rows, fields) {
        if (err) {
          return connection.rollback(function() {
            helpers.connection.queryError(err, connection);
            res.status(500).send('Query failed unexpectedly.');
          });
        }
        connection.query('DELETE FROM `page_id_bind` WHERE `page_id` = ? AND `bound_id` = ?', [page_id, detail_id], function (err, rows, fields) {
          if (err) {
            return connection.rollback(function() {
              helpers.connection.queryError(err, connection);
              res.status(500).send('Query failed unexpectedly.');
            });
          }
          connection.commit(function(err) {
            if (err) {
              return connection.rollback(function() {
                helpers.connection.queryError(err, connection);
                res.status(500).send('Query failed unexpectedly.');
              });
            }
            res.send('Success');
          });
        });
      });
    });
  }

  function getUniqueId(connection, id_starter, table, identifier, attempts) {
    var max_attempts = 10;
    if (!attempts) {
      attempts = 0;
    }
    return new Promise(function(resolve, reject) {
      var unique_id = helpers.generator.generateId(id_starter);
      var query = "SELECT * FROM `{0}` WHERE `{1}` = ? LIMIT 1".format(table, identifier);
      connection.query(query, [unique_id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        if (rows.length <= 0) {
          return resolve(unique_id);
        }
        attempts += 1;
        if (attempts >= max_attempts) {
          return reject({
            status: 500,
            message: "Attempted to find a unique id {0} times without success.".format(max_attempts)
          });
        }
        return resolve(getUniqueId(connection, id_starter, table, identifier, attempts));
      });
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

  app.put(STATICS.routes.page_detail, jsonParser, function(req, res) {
    var user_id = 'US_1234567890123';
    var page_id = req.query.id;
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }
      verifyUserHasAccess(connection, page_id, user_id, 'PUT').then(function(data) {
        updateDetail(req, res, connection);
        if (connection && connectionNotReleased(connection, pool)) {
          connection.release();
        }
      }, function(error) {
        responseWithError(error, res, connection, pool);
      });
    });
  });

  app.post(STATICS.routes.page_detail, jsonParser, function(req, res) {
    var user_id = 'US_1234567890123';
    var page_id = req.query.id;
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }
      verifyUserHasAccess(connection, page_id, user_id, 'POST').then(function(data) {
        addDetail(req, res, connection, pool);
        if (connection && connectionNotReleased(connection, pool)) {
          connection.release();
        }
      }, function(error) {
        responseWithError(error, res, connection, pool);
      });
    });
  });

  /**
   * For now, there is no true way to delete a detail: only remove the detail link from the page.
   */
  app.delete(STATICS.routes.page_detail, jsonParser, function(req, res) {
    var user_id = 'US_1234567890123';
    var page_id = req.query.id;
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }
      verifyUserHasAccess(connection, page_id, user_id, 'DELETE').then(function(data) {
        deleteDetail(req, res, connection, pool);
        if (connection && connectionNotReleased(connection, pool)) {
          connection.release();
        }
      }, function(error) {
        responseWithError(error, res, connection, pool);
      });
    });
  });
};
