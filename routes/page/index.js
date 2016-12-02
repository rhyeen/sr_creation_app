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
            'code': rows[i]['id'],
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

  function setRelativePages(connection, page, owner_id, section_code, index) {
    return new Promise(function(resolve, reject) {
      var page_id = getPageId(page);
      var page_code = getPageCode(page_id);
      var page_code_abbr = page_code.toLowerCase();
      var section_code_abbr = section_code.toLowerCase();
      var alpha_ordered = [page_code_abbr, section_code_abbr].sort();
      var query = "SELECT `{0}_summary`.`name` AS page_name, \
      `{0}_summary`.`summary` AS page_summary, \
      `{0}_summary`.`summary_tags` AS page_summary_tags, \
      `{1}_summary`.`id` AS id, \
      `{1}_summary`.`name` AS name, \
      `{1}_summary`.`summary` AS summary, \
      `{1}_summary`.`summary_tags` AS summary_tags \
      FROM `{0}_summary`, `mapping_{2}_{3}`, `{1}_summary` \
      WHERE `{0}_id` = ? AND \
      `{0}_summary`.`id` = `{0}_id` AND \
      `{1}_summary`.`id` = `{1}_id`";

      query = query.format(page_code_abbr, section_code_abbr, alpha_ordered[0], alpha_ordered[1]);
      // res.send(query);
      // return;
      connection.query(query, [page_id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }

        if (rows.length <= 0) {
          return resolve({
            page: page
          });
        }

        page['name'] = rows[0]['page_name'];
        page['summary'] = rows[0]['page_summary'];
        page['summary_tags'] = rows[0]['page_summary_tags'];

        for (i=0; i < rows.length; i++) {
          // @TODO: find some way to identify the index of relative_pages_sections
          page['relative_pages_sections'][index]['relative_pages'].push({
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

  function setPageInformation(connection, page) {
    return new Promise(function(resolve, reject) {
      if ('name' in page && page['name']) {
        return resolve({
          page: page
        });
      }
      var page_id = getPageId(page);
      var page_code = getPageCode(page_id);
      var page_code_abbr = page_code.toLowerCase();
      var query = "SELECT `name`, `summary`, `summary_tags` \
      FROM `{0}_summary` \
      WHERE `id` = ?";

      query = query.format(page_code_abbr);
      // res.send(query);
      // return;
      connection.query(query, [page_id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }

        if (rows.length <= 0) {
          return reject({
            status: 500,
            message: "Could not find extry for {0} in the database.".format(page_id)
          });
        }

        page['name'] = rows[0]['name'];
        page['summary'] = rows[0]['summary'];
        page['summary_tags'] = rows[0]['summary_tags'];

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
            var i, calls = [];
            relative_pages_sections = page['relative_pages_sections'];
            for (i = 0; i < relative_pages_sections.length; i++) {
              section_code = relative_pages_sections[i]['code'];
              calls.push(setRelativePages(connection, page, owner_id, section_code, i))
            }
            Promise.all(calls).then(function() {
              setPageInformation(connection, page).then(function(data) {
                if (connection) {
                  connection.release();
                }
                res.send(page);
              }, function(error) {
                responseWithError(error, res);
              });
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
