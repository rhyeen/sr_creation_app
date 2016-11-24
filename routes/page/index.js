module.exports = function(app, STATICS, helpers, Promise, pool) {
  function getPageCode(id) {
    var page_code = id.substring(0,2);
    return page_code.toUpperCase();
  }

  function getPageId(page) {
    return page['id'];
  }

  function setPageId(connection, req, page, owner_id) {
    return new Promise(function(resolve, reject) {
      if (req.query && req.query.id) {
        page['id'] = req.query.id;
        return resolve({
          page: page,
          owner_id: owner_id
        });
      }
      connection.query("SELECT `id` FROM `rr_summary` WHERE `owner_id` = ?", [owner_id], function(err, rows, fields) {
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
            message: "Owner does not have a main page."
          });
        }
        page['id'] = rows[0]['id'];

        return resolve({
          page: page,
          owner_id: owner_id
        });
      });
    });
  }

  function setRelativeLibraries(connection, page, owner_id) {
    return new Promise(function(resolve, reject) {
      try {
        var page_id = getPageId(page);
        var page_code = getPageCode(page_id);
      }
      catch (e) {
        return reject({
          status: 500,
          message: e.message
        });
      }
      
      page['relative_libraries'] = [];
      connection.query("SELECT `id_config`.id, `id_config`.name FROM `id_config`, `relevant_library` WHERE `relevant_library`.id = ? AND `relevant_library`.`relevant_library_id` = `id_config`.id", [page_code], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }

        for (i=0; i < rows.length; i++) {
          page['relative_libraries'].push({
            'name': rows[i]['name'],
            'id': rows[i]['id']
          });
        }

        return resolve({
          page: page,
          owner_id: owner_id
        });
      });
    });
  }

  function setRelativePagesSections(connection, page, owner_id) {
    return new Promise(function(resolve, reject) {
      var page_id = getPageId(page);
      var page_code = getPageCode(page_id);
      connection.query("SELECT `id_config`.`id`, `id_config`.`name` FROM `id_config`, `relevant_page` WHERE `relevant_page`.`id` = ? AND `relevant_page`.`relevant_page_id` = `id_config`.`id`", [page_code], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }

        page['relative_pages_sections'] = [];
        for (i=0; i < rows.length; i++) {
          page['relative_pages_sections'].push({
            'name': rows[i]['name'],
            'id': rows[i]['id'],
            'title': rows[i]['name'],
            'relative_pages': []
          });
        }

        return resolve({
          page: page,
          owner_id: owner_id
        });
      });
    });
  }

  function setRelativePages(connection, page, owner_id, page_id) {
    return new Promise(function(resolve, reject) {
      // @TODO: need to make X many queries for each relative_pages_section: grabbing the id.toLowerCase() to create the table lookups
      connection.query("SELECT `rr_summary`.`name` AS title, `ca_summary`.`id`, `ca_summary`.`name` AS name, `summary`, `summary_tags` FROM `rr_summary`, `mapping_ca_rr`, `ca_summary` WHERE `owner_id` = ? AND `rr_summary`.`id` = ? AND `ca_summary`.`id` = `ca_id`", [owner_id, page_id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }

        page['title'] = rows[0]['title'];
        for (i=0; i < rows.length; i++) {
          // @TODO: find some way to identify the index of relative_pages_sections
          page['relative_pages_sections'][0]['relative_pages'].push({
            'name': rows[i]['name'],
            'summary': rows[i]['summary'],
            'id': rows[i]['id'],
            'summary_tags': JSON.parse(rows[i]['summary_tags'])
          });
        }

        return resolve({
          page: page
        });
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

  app.get(STATICS.routes.overview_page, function(req, res) {
    var owner_id = 'US_1234567890123';
    var page = {};
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }      
      setPageId(connection, req, page, owner_id).then(function(data) {
        setRelativeLibraries(connection, page, owner_id).then(function(data) {
          setRelativePagesSections(connection, page, owner_id).then(function(data) {
            setRelativePages(connection, page, owner_id, 'RR_1234567890123').then(function(data) {
              if (connection) {
                connection.release();
              }
              res.send(page);
            }, function(error) {
              responseWithError(error, res);
            });
          }, function(error) {
            responseWithError(error, res);
          });
        }, function(error) {
          responseWithError(error, res);
        });
      }, function(error) {
        responseWithError(error, res);
      });
    });
  });
};
