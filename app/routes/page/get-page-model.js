let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");
let Promise = require("bluebird");

var exports = module.exports = {};

exports.getPage = function(page_id) {
  let page = getNewPage(page_id);
  return new Promise(function(resolve, reject) {
    mysql.getConnection(function(err, connection) {
      if (mysql.connectionError(err, connection)) {
        return reject(mysql.connectionError(err, connection));
      }
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
                    mysql.forceConnectionRelease(connection);
                    return resolve(page);
                  }, function(error) {
                    mysql.forceConnectionRelease(connection);
                    return reject(error);
                  });
                }, function(error) {
                  mysql.forceConnectionRelease(connection);
                  return reject(error);
                });
              }, function(error) {
                mysql.forceConnectionRelease(connection);
                return reject(error);
              });
            }, function(error) {
              mysql.forceConnectionRelease(connection);
              return reject(error);
            });
          }, function(error) {
            mysql.forceConnectionRelease(connection);
            return reject(error);
          });
        }, function(error) {
          mysql.forceConnectionRelease(connection);
          return reject(error);
        });
      }, function(error) {
        mysql.forceConnectionRelease(connection);
        return reject(error);
      });
    });
  });
};

function getNewPage(page_id) {
  return {
    id: page_id
  };
}

function getPageId(page) {
  return page['id'];
}

function setPageSummary(connection, page) {
  return new Promise(function(resolve, reject) {
    let page_id = getPageId(page);
    let query = "SELECT * FROM `page_summary` WHERE `page_id` = ? LIMIT 1";
    let params = [
      page_id
    ];
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
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
  let name = summary_data['name'];
  let properties = summary_data['properties'];
  if (properties) {
    properties = JSON.parse(properties);
  }
  let text = summary_data['text'];

  page['name'] = name;
  page['summary'] = {
    'properties': properties,
    'text': text
  };
}

function getPageContentData(connection, page) {
  let data_container = [];
  return new Promise(function(resolve, reject) {
    getPageContentProperties(connection, page).then(function (properties_list) {
      if (!properties_list || properties_list.length <= 0) {
        return resolve(page);
      }
      let properties;
      let getPageBoundIdsCalls = [];
      for (let i = 0; i < properties_list.length; i++) {
        properties = properties_list[i];
        data_container.push({
          'type': properties['type'],
          'properties': properties['properties'],
          'list': []
        });
        getPageBoundIdsCalls.push(getPageBoundIds(connection, page, data_container[i]));
      }
      Promise.all(getPageBoundIdsCalls).then(function() {
        resolve(data_container);
      }, function(error) {
        console.error(error);
        reject(error);
      });
    }, function(error) {
      console.error(error);
      return reject(error);
    });
  });
}

function getPageContentProperties(connection, page) {
  return new Promise(function(resolve, reject) {  
    let page_id = getPageId(page);
    let query = "SELECT `type`, `properties` FROM `page_content` WHERE `page_id` = ? AND `disabled` != 1";
    let params = [
      page_id
    ];
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      if (rows.length <= 0) {
        return resolve(null);
      }
      for (let row of rows) {
        if (row['properties']) {
          row['properties'] = JSON.parse(row['properties']);
        }
      }
      return resolve(rows);
    });
  });
}

function getPageBoundIds(connection, page, data_container) {
  return new Promise(function(resolve, reject) {  
    let page_id = getPageId(page);
    let query = "SELECT `bound_id` FROM `page_id_bind` WHERE `page_id` = ? AND `type` = ? AND `disabled` = 0 ORDER BY `order` ASC";
    let params = [
      page_id,
      data_container['type']
    ];
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      if (rows.length <= 0) {
        return resolve(data_container);
      }
      for (let row of rows) {
        data_container['list'].push(row['bound_id']);
      }
      return resolve(data_container);
    });
  });
}

function getPageSpecialsData(connection, page) {
  let data_container = [];
  return new Promise(function(resolve, reject) {
    getPageSpecialProperties(connection, page).then(function (properties_list) {
      if (!properties_list || properties_list.length <= 0) {
        return resolve(page);
      }
      let properties;
      let getPageBoundIdsCalls = [];
      for (let i = 0; i < properties_list.length; i++) {
        properties = properties_list[i];
        data_container.push({
          'type': properties['type'],
          'properties': properties['properties'],
          'list': []
        });
        getPageBoundIdsCalls.push(getPageBoundIds(connection, page, data_container[i]));
      }
      Promise.all(getPageBoundIdsCalls).then(function() {
        resolve(data_container);
      }, function(error) {
        console.error(error);
        reject(error);
      });
    }, function(error) {
      console.error(error);
      return reject(error);
    });
  });
}

function getPageSpecialProperties(connection, page) {
  return new Promise(function(resolve, reject) {  
    let page_id = getPageId(page);
    let query = "SELECT `type`, `properties` FROM `page_specials` WHERE `page_id` = ? AND `order_index` > -1 ORDER BY `order_index` ASC";
    let params = [
      page_id
    ];
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      if (rows.length <= 0) {
        return resolve(null);
      }
      for (let row of rows) {
        if (row['properties']) {
          row['properties'] = JSON.parse(row['properties']);
        }
      }
      return resolve(rows);
    });
  });
}

function getPageLinksData(connection, page) {
  let data_container = [];
  return new Promise(function(resolve, reject) {
    getPageLinksProperties(connection, page).then(function (properties_list) {
      if (!properties_list || properties_list.length <= 0) {
        return resolve(page);
      }
      let properties;
      let getPageBoundIdsCalls = [];
      for (let i = 0; i < properties_list.length; i++) {
        properties = properties_list[i];
        data_container.push({
          'type': properties['type'],
          'properties': properties['properties'],
          'list': []
        });
        getPageBoundIdsCalls.push(getPageBoundIds(connection, page, data_container[i]));
      }
      Promise.all(getPageBoundIdsCalls).then(function() {
        resolve(data_container);
      }, function(error) {
        console.error(error);
        reject(error);
      });
    }, function(error) {
      console.error(error);
      return reject(error);
    });
  });
}

function getPageLinksProperties(connection, page) {
  return new Promise(function(resolve, reject) {  
    let page_id = getPageId(page);
    let query = "SELECT `type`, `properties` FROM `page_links` WHERE `page_id` = ? AND `order_index` > -1 ORDER BY `order_index` ASC";
    let params = [
      page_id
    ];
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      if (rows.length <= 0) {
        return resolve(null);
      }
      for (let row of rows) {
        if (row['properties']) {
          row['properties'] = JSON.parse(row['properties']);
        }
      }
      return resolve(rows);
    });
  });
}

function getLinkListByType(connection, page, link_list_containers) {
  let calls = [];
  if (!link_list_containers || link_list_containers.length <= 0) {
    calls.push(resolveCall());
    return calls;
  }
  for (let i = 0; i < link_list_containers.length; i++) {
    let link_list_container = link_list_containers[i];
    let link_type = link_list_container['type'];
    let link_list = link_list_container['list'];
    let link_list_setter_function = getLinkListSetterFunction(link_type);
    let new_calls = getLinkListCalls(connection, page, link_list, link_list_setter_function, link_type);
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
  let link_list_setter_functions = {
    'DE': setPageDetail,
    'IM': setPageImage
  };
  if (link_type in link_list_setter_functions) {
    return link_list_setter_functions[link_type];
  }
  return setPageLink;
}

function getLinkListCalls(connection, page, link_list, link_list_setter_function, link_type) {
  let calls = [];
  if (!link_list || link_list.length <= 0) {
    calls.push(resolveCall());
    return calls;
  }
  for (let i = 0; i < link_list.length; i++) {
    let link_list_id = link_list[i];
    calls.push(link_list_setter_function(connection, page, link_list_id, i, link_type));
  }
  return calls;
}

function setPageDetail(connection, page, link_list_id, index, ignore) {
  // only used to conform to abstract function standard (setPageLink needs it).
  ignore = null;
  return new Promise(function(resolve, reject) {
    let page_id = getPageId(page);
    let query = "SELECT * FROM `page_details` WHERE `detail_id` = ? LIMIT 1";
    let params = [
      link_list_id
    ];
    connection.query(query, params, function(err, rows, fields) {
      // @TODO: probably want to find a way to only fail if more than X% of all calls in Promise.all fail.  But, only if 500's.  Other types of failures shouldn't occur if the structure is valid.
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      if (rows.length <= 0) {
        return reject({
          status: 404,
          message: `Unable to find ${link_list_id} details.`
        });
      }
      let detail_data = rows[0];
      let detail = page['details']['list'][index];
      detail['name'] = detail_data['name'];
      let detail_markdown = detail_data['content_mark_down'];
      let detail_partitions = detail_data['content_partitions'];
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
  return new Promise(function(resolve, reject) {
    let page_id = getPageId(page);
    let query = "SELECT * FROM `page_images` WHERE `image_id` = ? LIMIT 1";
    let params = [
      link_list_id
    ];
    connection.query(query, params, function(err, rows, fields) {
      // @TODO: probably want to find a way to only fail if more than X% of all calls in Promise.all fail.  But, only if 500's.  Other types of failures shouldn't occur if the structure is valid.
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      if (rows.length <= 0) {
        return reject({
          status: 404,
          message: `Unable to find ${link_list_id} images.`
        });
      }
      let image_data = rows[0];
      let image = page['images']['list'][index];
      image['name'] = image_data['name'];
      image['caption'] = image_data['caption'];
      image['source'] = image_data['source'];
      image['link'] = image_data['link'];
      image['thumbnail'] = {
        'link': image_data['thumbnail_link']
      }
      return resolve(page);
    });
  });
}

function setPageLink(connection, page, link_list_id, index, page_type) {
  return new Promise(function(resolve, reject) {
    let page_id = getPageId(page);
    let query = "SELECT * FROM `page_summary` WHERE `page_id` = ? LIMIT 1";
    let params = [
      link_list_id
    ];
    connection.query(query, params, function(err, rows, fields) {
      // @TODO: probably want to find a way to only fail if more than X% of all calls in Promise.all fail.  But, only if 500's.  Other types of failures shouldn't occur if the structure is valid.
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      if (rows.length <= 0) {
        return reject({
          status: 404,
          message: "Unable to find {0} page summary.".format(link_list_id)
        });
      }
      let page_link_data = rows[0];
      page_container = getPageContainerByType(page, page_type);
      let page_link = page_container['properties']['list'][index];
      page_link['name'] = page_link_data['name'];
      let page_link_properties = page_link_data['properties'];
      if (page_link_properties) {
        page_link_properties = JSON.parse(page_link_properties);
      }
      let page_link_text = page_link_data['text'];
      page_link['summary'] = {
        'properties': page_link_properties,
        'text': page_link_text
      };
      return resolve(page);
    });
  });
}

function getPageContainerByType(page, page_type) {
  let pages = page['pages'];
  for (let i = 0; i < pages.length; i++) {
    let current_page_type = pages[i]['type'];
    if (page_type == current_page_type) {
      return pages[i];
    }
  }
  throw new Error(`page_type of ${page_type} is unsupported`);
}

function setPageContainers(page, data) {
  if (!data || data.length <= 0) {
    return;
  }
  for (let i = 0; i < data.length; i++) {
    setPageContainer(page, data[i]);
  }
}

function setPageContainer(page, data) {
  let container_type = data['type'];
  let container_function = getContainerFunction(container_type);
  container_function(page, data);
}

function setPageDetailsContainer(page, data) {
  let key = 'details';
  page[key] = {};
  setupContainer(page, data, page[key]);
}

function setPageImagesContainer(page, data) {
  let key = 'images';
  page[key] = {};
  setupContainer(page, data, page[key]);
}

function setPageLinksContainer(page, data) {
  let key = 'pages';
  if (!(key in page)) {
    page[key] = [];
  }
  let page_type = data['type'];
  page[key].push({
    'type': page_type,
    'properties': {}
  });
  let last_index = page[key].length - 1;
  setupContainer(page, data, page[key][last_index]['properties']);
}

function setupContainer(page, data, container) {
  let container_properties = data['properties'];
  if (container_properties) {
    container_properties = JSON.parse(container_properties);
  }
  for (key in container_properties) {
    container[key] = container_properties[key];
  }
  let container_list = data['list'];
  container['list'] = [];
  if (!container_list) {
    return;
  }
  for (let i = 0; i < container_list.length; i++) {
    container['list'].push({
      'id': container_list[i]
    });
  }
}

function getContainerFunction(container_type) {
  let container_functions = {
    'DE': setPageDetailsContainer,
    'IM': setPageImagesContainer
  };
  if (container_type in container_functions) {
    return container_functions[container_type];
  }
  return setPageLinksContainer;
}