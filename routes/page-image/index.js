module.exports = function(app, STATICS, helpers, Promise, pool, jsonParser) {
  function updateImage(req, res, connection) {
    var body = req.body;
    var page_id = req.query.id;
    var image_type = 'IM';
    var image_id = req.query.image;
    var image_name = body['name'];
    var image_caption = body['caption'];
    var image_source = body['source'];
    var image_link = body['link'];
    var image_thumbnail = body['thumbnail'];
    var thumbnail_link = image_thumbnail['link'];
    
    // we first need to verify that the image is actually associated with the given page_id, as the user may have maliciously given a page_id they have access over to manipulate an unassociated image.
    var query = "SELECT 1 FROM `page_content` WHERE `page_id` = ? AND `type` = ? AND `list` LIKE " + connection.escape('%' + image_id + '%') + " LIMIT 1";
    connection.query(query, [page_id, image_type], function(err, rows, fields) {
      if (helpers.connection.queryError(err, connection)) {
        res.status(500).send('Query failed unexpectedly.');
        return;
      }
      if (!rows || rows.length <= 0) {
        res.status(400).send("Page id {0} not associated with {1}.".format(page_id, image_id));
        return;
      }
      connection.query("UPDATE `page_images` SET `name` = ?, `caption` = ?, `link` = ?, `thumbnail_link` = ?, `source` = ? WHERE `image_id` = ?", [image_name, image_caption, image_link, thumbnail_link, image_source, image_id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          res.status(500).send('Query failed unexpectedly.');

          return;
        }
        res.send('Success');
        return;
      });
    });
  }

  function addImage(req, res, connection, pool) {
    var image_list = [];
    var page_id = req.query.id;
    var image_type = 'IM';
    var image_table = 'page_images';
    var identifier = 'image_id';
    var body = req.body;
    var image_name = body['name'];
    var image_caption = body['caption'];
    var image_source = body['source'];
    var image_link = body['link'];
    var image_thumbnail = body['thumbnail'];
    var thumbnail_link = image_thumbnail['link'];

    getUniqueId(connection, image_type, image_table, identifier).then(function(image_id) {
      connection.query("INSERT INTO `page_images` (`image_id`, `name`, `link`, `thumbnail_link`, `caption`, `source`) VALUES (?, ?, ?, ?, ?)", [image_id, image_name, image_link, thumbnail_link, image_caption, image_source], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          res.status(500).send('Query failed unexpectedly.');
          return;
        }

        connection.query("SELECT `list` FROM `page_content` WHERE `page_id` = ? AND `type` = ? LIMIT 1", [page_id, image_type], function(err, rows, fields) {
          if (helpers.connection.queryError(err, connection)) {
            res.status(500).send('Query failed unexpectedly.');
            return;
          }

          if (rows.length > 0) {
            if (rows[0]['list']) {
              image_list = JSON.parse(rows[0]['list']);
            }
            image_list.push(image_id);
            image_list = JSON.stringify(image_list);
            connection.query("UPDATE `page_content` SET `list` = ? WHERE `page_id` = ? AND `type` = ?", [image_list, page_id, image_type], function(err, rows, fields) {
              if (helpers.connection.queryError(err, connection)) {
                res.status(500).send('Query failed unexpectedly.');
                return;
              }
              res.send(image_id);
              return;
            });
          } else {
            image_list.push(image_id);
            image_list = JSON.stringify(image_list);
            connection.query("INSERT INTO `page_content` (`page_id`, `type`, `list`) VALUES (?, ?, ?)", [page_id, image_type, image_list], function(err, rows, fields) {
              if (helpers.connection.queryError(err, connection)) {
                res.status(500).send('Query failed unexpectedly.');
                return;
              }
              res.send(image_id);
              return;
            });
          }
        });
      });
    }, function(error) {
      responseWithError(error, res, connection, pool);
    });
  }

  function deleteImage(req, res, connection, pool) {
    var i, calls = [], new_list;
    var page_id = req.query.id;
    var image_id = req.query.image;
    query = "SELECT `page_id`, `list` FROM `page_content` WHERE `list` LIKE " + connection.escape('%' + image_id + '%') + " AND `page_id` = " + connection.escape(page_id);
    connection.query(query, function(err, rows, fields) {
      if (helpers.connection.queryError(err, connection)) {
        res.status(500).send('Query failed unexpectedly.');
        return;
      }
      if (rows.length <= 0) {
        res.send('Success');
        return;
      }
      // for now, we force the user to provide a page_id, and we only remove the image from that page; however, this is set up to remove the image from any page if page_id = ? is removed from the query.
      // We don't want to do this, since the user may not have access to all pages with that image.
      for (i = 0; i < rows.length; i++) {
        new_list = removeImageFromList(rows[i]['list'], image_id);
        calls.push(updateImageList(connection, rows[i]['page_id'], new_list));
      }
      Promise.all(calls).then(function() {
        res.send('Success');
        return;
      }, function(error) {
        responseWithError(error, res, connection, pool);
      });
    });
  }

  function removeImageFromList(image_list_string, image_id) {
    var index = 0, image, image_list = [];
    if (image_list_string) {
      image_list = JSON.parse(image_list_string);
    } else {
      return image_list;
    }
    while (index > -1) {
      index = image_list.indexOf(image_id);
      if (index > -1) {
        image_list.splice(index, 1);
      }
    }
    return image_list;
  }

  function updateImageList(connection, page_id, image_list) {
    var image_type = 'IM';
    image_list = JSON.stringify(image_list);
    return new Promise(function(resolve, reject) {
      connection.query("UPDATE `page_content` SET `list` = ? WHERE `page_id` = ? AND `type` = ?", [image_list, page_id, image_type], function(err, rows, fields) {
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

  function getUniqueId(connection, id_starter, table, identifier, attempts) {
    var max_attempts = 10;
    if (!attempts) {
      attempts = 0;
    }
    return new Promise(function(resolve, reject) {
      var unique_id = helpers.generator.generateId(id_starter);
      var query = "SELECT 1 FROM `{0}` WHERE `{1}` = ? LIMIT 1".format(table, identifier);
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

  app.put(STATICS.routes.page_image, jsonParser, function(req, res) {
    var user_id = 'US_1234567890123';
    var page_id = req.query.id;
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }
      verifyUserHasAccess(connection, page_id, user_id, 'PUT').then(function(data) {
        updateImage(req, res, connection);
        if (connection && connectionNotReleased(connection, pool)) {
          connection.release();
        }
      }, function(error) {
        responseWithError(error, res, connection, pool);
      });
    });
  });

  app.post(STATICS.routes.page_image, jsonParser, function(req, res) {
    var user_id = 'US_1234567890123';
    var page_id = req.query.id;
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }
      verifyUserHasAccess(connection, page_id, user_id, 'POST').then(function(data) {
        addImage(req, res, connection, pool);
        if (connection && connectionNotReleased(connection, pool)) {
          connection.release();
        }
      }, function(error) {
        responseWithError(error, res, connection, pool);
      });
    });
  });

  /**
   * For now, there is no true way to delete a image: only remove the image link from the page.
   */
  app.delete(STATICS.routes.page_image, jsonParser, function(req, res) {
    var user_id = 'US_1234567890123';
    var page_id = req.query.id;
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }
      verifyUserHasAccess(connection, page_id, user_id, 'DELETE').then(function(data) {
        deleteImage(req, res, connection, pool);
        if (connection && connectionNotReleased(connection, pool)) {
          connection.release();
        }
      }, function(error) {
        responseWithError(error, res, connection, pool);
      });
    });
  });
};
