module.exports = function(app, STATICS, helpers, Promise, connection) {

  function getRelatedLibrariesIds(rows) {
    var id_config = JSON.parse(rows[0]['config']);
    var related_libraries = id_config['related_libraries'];
    var related_library_ids = [];
    for (i=0; i < related_libraries.length; i++) {
      related_library_ids.push(related_libraries[i]['id']);
    }
    return related_library_ids;
  }

  function getPageCode(id) {
    var page_code = id.substring(0,2);
    return page_code.toUpperCase();
  }

  function getPageId(connection, req, owner_id) {
    if (!req.query || !req.query.id) {
      connection.query("SELECT `id` FROM `rr_summary` WHERE `owner_id` = ?", [owner_id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection, res)) {
          return Promise.reject("Query failed unexpectedly.");
        }
        if (rows.length <= 0) {
          if (connection) {
            connection.release();
          }
          return Promise.reject("Owner does not have a main page.");
        }
        return Promise.resolve(rows[0]['id']);
      });
    }
    return Promise.resolve(req.query.id);
  }

  app.get(STATICS.routes.overview_page, function(req, res) {
    var i, page_id, page_code;
    var owner_id = 'US_1234567890123';
    var page = {};

    pool.getConnectionAsync().then(function(connection) {

    }) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }

      getPageId(connection, req, owner_id).then(function(data) {
        page_id = data;
        page_code = getPageCode(page_id);

        connection.query("SELECT `id_config`.id, `id_config`.name FROM `id_config`, `relevant_library` WHERE `relevant_library`.id = ? AND `relevant_library`.`relevant_library_id` = `id_config`.id", [page_code], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection, res, true)) {
          return;
        }

        page['relative_libraries'] = [];
        for (i=0; i < rows.length; i++) {
          page['relative_libraries'].push({
            'name': rows[i]['name'],
            'id': rows[i]['id']
          });
        }

        connection.query("SELECT `id_config`.`id`, `id_config`.`name` FROM `id_config`, `relevant_page` WHERE `relevant_page`.`id` = ? AND `relevant_page`.`relevant_page_id` = `id_config`.`id`", [page_code], function(err, rows, fields) {
          if (helpers.connection.queryError(err, connection, res)) {
            return;
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

          // @TODO: need to make X many queries for each relative_pages_section: grabbing the id.toLowerCase() to create the table lookups
          connection.query("SELECT `rr_summary`.`name` AS title, `ca_summary`.`id`, `ca_summary`.`name` AS name, `summary`, `summary_tags` FROM `rr_summary`, `mapping_ca_rr`, `ca_summary` WHERE `owner_id` = ? AND `rr_summary`.`id` = ? AND `ca_summary`.`id` = `ca_id`", [owner_id, page_id], function(err, rows, fields) {
            if (helpers.connection.queryError(err, connection, res)) {
              return;
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
            res.send(page);
            connection.release();
          });
        });
      });

      }, function(error) {
        res.status(400).send(error);
        return;
      });
    });
  });
};
