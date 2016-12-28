module.exports = function(app, STATICS, helpers, Promise, pool, jsonParser) {

  function verifyUserHasAccess(connection, page_id, user_id, request_method) {
    var method_column = 'page_{0}'.format(request_method);
    var query = "SELECT `{0}` FROM `page_auth` WHERE `user_id` = ? AND `page_id` = ? AND `disabled` != 1 LIMIT 1".format(method_column);
    return new Promise(function(resolve, reject) {
      // new page is not being linked to a previous page: no permissioning required.
      if (!page_id) {
        return resolve();
      }
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

  function validatePageType(page_type) {
    if (!page_type || page_type.length != 2) {
      return null;
    }
    return page_type;
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

  function addPageAuth(connection, page_id, user_id) {
    return new Promise(function(resolve, reject) {
      connection.query("INSERT INTO `page_auth` (`page_id`, `user_id`, `page_POST`, `page_PUT`, `page_GET`, `page_DELETE`, `disabled`) VALUES (?, ?, 1, 1, 1, 1, 0)", [page_id, user_id], function(err, rows, fields) {
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

  function addDefaultPageEntries(connection, page_id, page_type, page_name, link_id) {
    return new Promise(function(resolve, reject) {
      getPageDefaults(connection, page_type).then(function(defaults) {
        setPageSummary(connection, page_id, page_name, defaults).then(function(data) {
          setPageContent(connection, page_id, defaults).then(function(data) {
            setPageLinks(connection, page_id, defaults).then(function(data) {
              setPageSpecials(connection, page_id, defaults).then(function(data) {
                updateParentPageLinks(connection, page_id, page_type, link_id).then(function(data) {
                  resolve('Success');
                }, function(error) {
                  reject(error);
                });
              }, function(error) {
                reject(error);
              });
            }, function(error) {
              reject(error);
            });
          }, function(error) {
            reject(error);
          });
        }, function(error) {
          reject(error);
        });
      }, function(error) {
        reject(error);
      });
    });
  }

  function getPageDefaults(connection, page_type) {
    return new Promise(function(resolve, reject) {
      connection.query("SELECT `default_config` FROM `page_defaults` WHERE `type` = ? LIMIT 1", [page_type], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        if (rows.length <= 0) {
          return reject({
            status: 500,
            message: "Page type {0} is invalid.".format(page_type)
          });
        }
        return resolve(JSON.parse(rows[0]['default_config']));
      });
    });
  }

  function setPageSummary(connection, page_id, page_name, defaults) {
    var summary_default_text = getSummaryDefaultText(defaults);
    var summary_default_properties = getSummaryDefaultProperties(defaults);
    return new Promise(function(resolve, reject) {
      connection.query("INSERT INTO `page_summary` (`page_id`, `name`, `text`, `properties`) VALUES (?, ?, ? ,?)", [page_id, page_name, summary_default_text, summary_default_properties], function(err, rows, fields) {
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

  function getSummaryDefaultText(defaults) {
    if (!('summary' in defaults)) {
      return null;
    }
    var summary = defaults['summary'];
    if (!('text' in defaults)) {
      return null;
    }
    return summary['text'];
  }

  function getSummaryDefaultProperties(defaults) {
    if (!('summary' in defaults)) {
      return null;
    }
    var summary = defaults['summary'];
    if (!('properties' in defaults)) {
      return null;
    }
    return JSON.stringify(summary['properties']);
  }

  function setPageContent(connection, page_id, defaults) {
    return new Promise(function(resolve, reject) {
      setPageDefault('details', connection, page_id, defaults).then(function(data) {
        setPageDefault('images', connection, page_id, defaults).then(function(data) {
          resolve('Success');
        }, function(error) {
          reject(error);
        });
      }, function(error) {
        reject(error);
      });
    });
  }

  function setPageDefault(content_type, connection, page_id, defaults) {
    var type;
    if (content_type == 'details') {
      type = 'DE';
    } else {
      type = 'IM';
    }
    var disabled = getDisabled(defaults, content_type);
    var properties = getProperties(defaults, content_type);
    var list = getList(defaults, content_type);
    return new Promise(function(resolve, reject) {
      connection.query("INSERT INTO `page_content` (`page_id`, `type`, `properties`, `list`, `disabled`) VALUES (?, ?, ? ,?, ?)", [page_id, type, properties, list, disabled], function(err, rows, fields) {
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

  function getDisabled(defaults, content_type) {
    if (!(content_type in defaults)) {
      return 0;
    }
    var content = defaults[content_type];
    if (!('hidden' in content)) {
      return 0;
    }
    if (content['hidden']) {
      return 1;
    }
    return 0;
  }

  function getProperties(defaults, content_type) {
    if (!(content_type in defaults)) {
      return null;
    }
    var content = defaults[content_type];
    if (!('properties' in content)) {
      return null;
    }
    return content['properties'];
  }

  function getList(defaults, content_type) {
    if (!(content_type in defaults)) {
      return null;
    }
    var content = defaults[content_type];
    if (!('list' in content)) {
      return null;
    }
    return content['list'];
  }

  function setPageLinks(connection, page_id, defaults) {
    var pages = getPages(defaults);
    return new Promise(function(resolve, reject) {
      if (!pages || pages.length <= 0) {
        return resolve('Success');
      }
      Promise.all(setPageLinkCalls(connection, page_id, pages)).then(function() {
        return resolve('Success');
      }, function(error) {
        return reject(error);
      });
    });
  }

  function getPages(defaults) {
    if (!('pages' in defaults)) {
      return null;
    }
    return defaults['pages'];
  }

  function setPageLinkCalls(connection, page_id, pages) {
    var i, calls = [];
    for (i = 0; i < pages.length; i++) {
      calls.push(setPageLink(connection, page_id, pages[i], i));
    }
    return calls;
  }

  function setPageLink(connection, page_id, page, order_index) {
    var type = getPageType(page);
    var properties = getPageProperties(page);
    var list = getPageList(page);
    return new Promise(function(resolve, reject) {
      if (!type) {
        reject({
          status: 500,
          message: "Page type not found in page default config"
        });
      }
      connection.query("INSERT INTO `page_links` (`page_id`, `type`, `properties`, `list`, `order_index`) VALUES (?, ?, ? ,?, ?)", [page_id, type, properties, list, order_index], function(err, rows, fields) {
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

  function getPageType(page) {
    if (!('type' in page)) {
      return null;
    }
    return page['type'];
  }

  function getPageProperties(page) {
    if (!('properties' in page)) {
      return null;
    }
    return page['properties'];
  }

  function getPageList(page) {
    if (!('list' in page)) {
      return null;
    }
    return page['list'];
  }

  function setPageSpecials(connection, page_id, defaults) {
    return new Promise(function(resolve, reject) {
      // @TODO: not 100% certain how these will work yet: just return that we're good for now.
      return resolve('Success');
    });
  }

  function updateParentPageLinks(connection, page_id, page_type, link_id) {
    var list = [];
    return new Promise(function(resolve, reject) {
      if (!link_id) {
        resolve('Success');
      }
      connection.query("SELECT `list` FROM `page_links` WHERE `page_id` = ? AND `type` = ? LIMIT 1", [link_id, page_type], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        if (rows && rows.length > 0 && rows[0]['list']) {
          list = JSON.parse(rows[0]['list']);
        }
        list.push(page_id);
        list = JSON.stringify(list);
        connection.query("UPDATE `page_links` SET `list` = ? WHERE `page_id` = ? AND `type` = ?", [list, link_id, page_type], function(err, rows, fields) {
          if (helpers.connection.queryError(err, connection)) {
            return reject({
              status: 500,
              message: "Query failed unexpectedly."
            });
          }
          return resolve('Success');
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

  app.put(STATICS.route_roots.page, function(req, res) {
    var user_id = 'US_1234567890123';
    var link_id = req.query.link;
    var query_page_type = req.query.type;
    var page_type = validatePageType(query_page_type);
    var page_name = req.query.name;
    if (!page_type) {
      res.status(500).send('Page type: {0} is unsupported.'.format(query_page_type));
      return;
    }
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }      
      verifyUserHasAccess(connection, link_id, user_id, 'PUT').then(function(data) {
        getUniqueId(connection, page_type, 'page_auth', 'page_id').then(function(page_id) {
          addPageAuth(connection, page_id, user_id).then(function(data) {
            addDefaultPageEntries(connection, page_id, page_type, page_name, link_id).then(function(data) {
              if (connection) {
                connection.release();
              }
              res.send(page_id);
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
