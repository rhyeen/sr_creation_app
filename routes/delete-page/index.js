module.exports = function(app, STATICS, helpers, Promise, pool, jsonParser) {

  function verifyUserHasAccess(connection, page_id, user_id, request_method) {
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

  function disablePage(connection, page_id) {
    return new Promise(function(resolve, reject) {
      connection.query("UPDATE `page_auth` SET `disabled` = 1 WHERE `page_id` = ?", [page_id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        return resolve('Success');
      });
    });
  }

  function getPageLinks(connection, page_id) {
    var query = "SELECT `page_id`, `type`, `list` FROM `page_links` WHERE `list` LIKE " + connection.escape('%' + page_id + '%');
    return new Promise(function(resolve, reject) {
      connection.query(query, function(err, rows, fields) {
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

  function getSetPageLinksCalls(connection, page_id, link_list_containers) {
    var i, calls, link_type, link_list, link_page_id, link_list_container;
    calls = [];
    if (!link_list_containers || link_list_containers.length <= 0) {
      calls.push(resolveCall());
      return calls;
    }
    for (i = 0; i < link_list_containers.length; i++) {
      link_list_container = link_list_containers[i];
      link_type = link_list_container['type'];
      link_list = link_list_container['list'];
      link_page_id = link_list_container['page_id'];
      link_list = removePageIdFromList(page_id, link_list);
      calls.push(updatePageLinks(connection, link_list, link_type, link_page_id))
    }
    return calls;
  }

  function resolveCall() {
    return new Promise(function(resolve, reject) {
      return resolve();
    });
  }

  function removePageIdFromList(page_id, page_links_string) {
    var index = 0, page, page_links = [];
    if (page_links_string) {
      page_links = JSON.parse(page_links_string);
    } else {
      return page_links;
    }
    while (index > -1) {
      index = page_links.indexOf(page_id);
      if (index > -1) {
        page_links.splice(index, 1);
      }
    }
    return page_links;
  }

  function updatePageLinks(connection, page_links, page_type, page_id) {
    if (page_links) {
      page_links = JSON.stringify(page_links);
    }
    return new Promise(function(resolve, reject) {
      connection.query("UPDATE `page_links` SET `list` = ? WHERE `page_id` = ? AND `type` = ?", [page_links, page_id, page_type], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        return resolve('Success');
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

  /**
   * Pages are never truly deleted: only disabled.
   * A disabled page:
   * + is removed from all page links, and cannot be added as new page links (via the UI: 
   *   still possible if page_links_service is used, but only due to laziness to add such a check).
   * + is set to read-only mode and is currently impossible to retrieve via the API.
   *
   * Eventually, one will be able to access a deleted page by retrieving it via the get_page_service,
   * or by using a special settings page to retrieve disabled pages and reenable them.
   */
  app.delete(STATICS.route_roots.page, function(req, res) {
    var user_id = 'US_1234567890123';
    var page_id = req.query.id;

    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }      
      verifyUserHasAccess(connection, page_id, user_id, 'DELETE').then(function(data) {
        disablePage(connection, page_id).then(function(data) {
          getPageLinks(connection, page_id).then(function(data) {
            Promise.all(getSetPageLinksCalls(connection, page_id, data)).then(function() {
              if (connection && connectionNotReleased(connection, pool)) {
                connection.release();
              }
              res.send('Success');
            }, function(error) {
              responseWithError(error, res, connection, pool);
            });
          }, function(error) {
            responseWithError(error, res, connection, pool);
          });
        }, function(error) {
          responseWithError(error, res, connection, pool);
        });
      }, function(error) {
        responseWithError(error, res, connection, pool);
      });
    });
  });
};
