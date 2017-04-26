module.exports = function(app, STATICS, helpers, Promise, pool, jsonParser) {
  function getPageId(page) {
    return page['id'];
  }

  function setPageId(connection, req, page, user_id) {
    return new Promise(function(resolve, reject) {
      if (req.query && req.query.id) {
        page['id'] = req.query.id;
        return resolve({
          page: page,
          user_id: user_id
        });
      }
      connection.query("SELECT `page_id` FROM `page_home` WHERE `user_id` = ? LIMIT 1", [user_id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        if (rows.length <= 0) {
          return reject({
            status: 400,
            message: "User does not have a home page."
          });
        }
        page['id'] = rows[0]['page_id'];

        return resolve({
          page: page
        });
      });
    });
  }

  function verifyUserHasAccess(connection, page, user_id, request_method) {
    var page_id;
    var method_column = 'page_{0}'.format(request_method);
    var query = "SELECT `{0}` FROM `page_auth` WHERE `user_id` = ? AND `page_id` = ? LIMIT 1".format(method_column);
    return new Promise(function(resolve, reject) {
      page_id = getPageId(page);
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

        return resolve({
          page: page
        });
      });
    });
  }

  function setPageSummary(connection, page) {
    var page_id;
    return new Promise(function(resolve, reject) {
      page_id = getPageId(page);
      connection.query("SELECT * FROM `page_summary` WHERE `page_id` = ? LIMIT 1", [page_id], function(err, rows, fields) {
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
        setPageSummaryData(page, rows[0]);
        return resolve({
          page: page
        });
      });
    });
  }

  function setPageSummaryData(page, summary_data) {
    var name, properties, text;
    name = summary_data['name'];
    properties = summary_data['properties'];
    if (properties) {
      properties = JSON.parse(properties);
    }
    text = summary_data['text'];

    page['name'] = name;
    page['summary'] = {
      'properties': properties,
      'text': text
    };
  }

  function getPageContentData(connection, page) {
    var page_id;
    return new Promise(function(resolve, reject) {
      page_id = getPageId(page);
      connection.query("SELECT * FROM `page_content` WHERE `page_id` = ? AND `disabled` != 1", [page_id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        if (rows.length <= 0) {
          return resolve(null);
        }
        return resolve(rows);
      });
    });
  }

  function getPageSpecialsData(connection, page) {
    var page_id;
    return new Promise(function(resolve, reject) {
      page_id = getPageId(page);
      connection.query("SELECT * FROM `page_specials` WHERE `page_id` = ? AND `order_index` > -1 ORDER BY `order_index` DESC", [page_id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        if (rows.length <= 0) {
          return resolve(null);
        }
        return resolve(rows);
      });
    });
  }

  function getPageLinksData(connection, page) {
    var page_id;
    return new Promise(function(resolve, reject) {
      page_id = getPageId(page);
      connection.query("SELECT * FROM `page_links` WHERE `page_id` = ? AND `order_index` >= 0 ORDER BY `order_index` DESC", [page_id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        if (rows.length <= 0) {
          return resolve(null);
        }
        return resolve(rows);
      });
    });
  }

  function getLinkListByType(connection, page, link_list_containers) {
    var i, calls, new_calls, link_type, link_list_setter_function, link_list, link_list_container;
    calls = [];
    if (!link_list_containers || link_list_containers.length <= 0) {
      calls.push(resolveCall());
      return calls;
    }
    for (i = 0; i < link_list_containers.length; i++) {
      link_list_container = link_list_containers[i];
      link_type = link_list_container['type'];
      link_list = link_list_container['list'];
      if (link_list) {
        link_list = JSON.parse(link_list);
      }
      link_list_setter_function = getLinkListSetterFunction(link_type);
      new_calls = getLinkListCalls(connection, page, link_list, link_list_setter_function, link_type);
      calls.push.apply(calls, new_calls);
    }
    return calls;
  }

  function resolveCall() {
    return new Promise(function(resolve, reject) {
      return resolve();
    });
  }

  function getLinkListSetterFunction(link_type) {
    var link_list_setter_functions = {
      'DE': setPageDetail,
      'IM': setPageImage
    };
    if (link_type in link_list_setter_functions) {
      return link_list_setter_functions[link_type];
    }
    return setPageLink;
  }

  function getLinkListCalls(connection, page, link_list, link_list_setter_function, link_type) {
    var i, link_list_id, calls = [];
    if (!link_list || link_list.length <= 0) {
      calls.push(resolveCall());
      return calls;
    }
    for (i = 0; i < link_list.length; i++) {
      link_list_id = link_list[i];
      calls.push(link_list_setter_function(connection, page, link_list_id, i, link_type));
    }
    return calls;
  }

  function setPageDetail(connection, page, link_list_id, index, ignore) {
    // only used to conform to abstract function standard (setPageLink needs it).
    ignore = null;
    var page_id, detail_data, detail, detail_markdown, detail_partitions;
    return new Promise(function(resolve, reject) {
      page_id = getPageId(page);
      connection.query("SELECT * FROM `page_details` WHERE `detail_id` = ? LIMIT 1", [link_list_id], function(err, rows, fields) {
        // @TODO: probably want to find a way to only fail if more than X% of all calls in Promise.all fail.  But, only if 500's.  Other types of failures shouldn't occur if the structure is valid.
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        if (rows.length <= 0) {
          return reject({
            status: 404,
            message: "Unable to find {0} details.".format(link_list_id)
          });
        }
        detail_data = rows[0];
        detail = page['details']['list'][index];
        detail['name'] = detail_data['name'];
        detail_markdown = detail_data['content_mark_down'];
        detail_partitions = detail_data['content_partitions'];
        if (detail_partitions) {
          detail_partitions = JSON.parse(detail_partitions);
        }
        detail['content'] = {
          'mark_down': detail_markdown,
          'partitions': detail_partitions
        };
        return resolve(page);
      });
    });
  }

  function setPageImage(connection, page, link_list_id, index, ignore) {
    // only used to conform to abstract function standard (setPageLink needs it).
    ignore = null;
    var page_id, image_data, image;
    return new Promise(function(resolve, reject) {
      page_id = getPageId(page);
      connection.query("SELECT * FROM `page_images` WHERE `image_id` = ? LIMIT 1", [link_list_id], function(err, rows, fields) {
        // @TODO: probably want to find a way to only fail if more than X% of all calls in Promise.all fail.  But, only if 500's.  Other types of failures shouldn't occur if the structure is valid.
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        if (rows.length <= 0) {
          return reject({
            status: 404,
            message: "Unable to find {0} images.".format(link_list_id)
          });
        }
        image_data = rows[0];
        image = page['images']['list'][index];
        image['name'] = image_data['name'];
        image['caption'] = image_data['caption'];
        image['link'] = image_data['link'];
        image['thumbnail'] = {
          'link': image_data['thumbnail_link']
        }
        return resolve(page);
      });
    });
  }

  function setPageLink(connection, page, link_list_id, index, page_type) {
    var page_id, page, page_link_data, page_link, page_link_properties, page_link_text;
    return new Promise(function(resolve, reject) {
      page_id = getPageId(page);
      connection.query("SELECT * FROM `page_summary` WHERE `page_id` = ? LIMIT 1", [link_list_id], function(err, rows, fields) {
        // @TODO: probably want to find a way to only fail if more than X% of all calls in Promise.all fail.  But, only if 500's.  Other types of failures shouldn't occur if the structure is valid.
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }
        if (rows.length <= 0) {
          return reject({
            status: 404,
            message: "Unable to find {0} page summary.".format(link_list_id)
          });
        }
        page_link_data = rows[0];
        console.log(JSON.stringify(page));
        page_container = getPageContainerByType(page, page_type);
        page_link = page_container['properties']['list'][index];
        page_link['name'] = page_link_data['name'];
        page_link_properties = page_link_data['properties'];
        if (page_link_properties) {
          page_link_properties = JSON.parse(page_link_properties);
        }
        page_link_text = page_link_data['text'];
        page_link['summary'] = {
          'properties': page_link_properties,
          'text': page_link_text
        };
        return resolve(page);
      });
    });
  }

  function getPageContainerByType(page, page_type) {
    var i, current_page_type;
    var pages = page['pages'];
    for (i = 0; i < pages.length; i++) {
      current_page_type = pages[i]['type'];
      if (page_type == current_page_type) {
        return pages[i];
      }
    }
    throw new Error('page_type of {0} is unsupported'.format(page_type));
  }

  function setPageContainers(page, data) {
    var i;
    if (!data || data.length <= 0) {
      return;
    }
    for (i = 0; i < data.length; i++) {
      setPageContainer(page, data[i]);
    }
  }

  function setPageContainer(page, data) {
    var key, i, container_type, container_key, container_properties, container_list;
    container_type = data['type'];
    container_function = getContainerFunction(container_type);
    container_function(page, data);
  }

  function setPageDetailsContainer(page, data) {
    var key = 'details';
    page[key] = {};
    setupContainer(page, data, page[key]);
  }

  function setPageImagesContainer(page, data) {
    var key = 'images';
    page[key] = {};
    setupContainer(page, data, page[key]);
  }

  function setPageLinksContainer(page, data) {
    var page_type, last_index, key = 'pages';
    if (!(key in page)) {
      page[key] = [];
    }
    page_type = data['type'];
    page[key].push({
      'type': page_type,
      'properties': {}
    });
    last_index = page[key].length - 1;
    setupContainer(page, data, page[key][last_index]['properties']);
  }

  function setupContainer(page, data, container) {
    container_properties = data['properties'];
    if (container_properties) {
      container_properties = JSON.parse(container_properties);
    }
    for (key in container_properties) {
      container[key] = container_properties[key];
    }
    container_list = data['list'];
    if (container_list) {
      container_list = JSON.parse(container_list);
    }
    container['list'] = [];
    if (!container_list) {
      return;
    }
    for (i = 0; i < container_list.length; i++) {
      container['list'].push({
        'id': container_list[i]
      });
    }
  }

  function getContainerFunction(container_type) {
    var container_functions = {
      'DE': setPageDetailsContainer,
      'IM': setPageImagesContainer
    };
    if (container_type in container_functions) {
      return container_functions[container_type];
    }
    return setPageLinksContainer;
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

  app.get(STATICS.route_roots.page, function(req, res) {
    var user_id = 'US_1234567890123';
    var page = {};

    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }      
      setPageId(connection, req, page, user_id).then(function(data) {
        verifyUserHasAccess(connection, page, user_id, 'GET').then(function(data) {
          setPageSummary(connection, page).then(function(data) {
            getPageContentData(connection, page).then(function(data) {
              setPageContainers(page, data);
              Promise.all(getLinkListByType(connection, page, data)).then(function() {
                getPageSpecialsData(connection, page).then(function(data) {
                  setPageContainers(page, data);
                  Promise.all(getLinkListByType(connection, page, data)).then(function() {
                    getPageLinksData(connection, page).then(function(data) {
                      setPageContainers(page, data);
                      Promise.all(getLinkListByType(connection, page, data)).then(function() {
                        if (connection && connectionNotReleased(connection, pool)) {
                          connection.release();
                        }
                        res.send(page);
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
      }, function(error) {
        responseWithError(error, res, connection, pool);
      });
    });
  });
};
