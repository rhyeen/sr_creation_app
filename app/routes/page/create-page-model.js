let tools = require("../../lib/tools");
let mysql = require("../../lib/mysql-connection");
let Promise = require("bluebird");
let manage_content = require("../../lib/services/manage-content");

var exports = module.exports = {};

exports.createPage = function(link_id, page_type, page_name, user_id) {
  return new Promise(function(resolve, reject) {
    mysql.getConnection(function(err, connection) {
      if (mysql.connectionError(err, connection)) {
        return reject(mysql.connectionError(err, connection));
      }
      tools.getUniqueId(page_type, 'page_auth', 'page_id').then(function(page_id) {
        addPageAuth(connection, page_id, user_id).then(function(data) {
          addDefaultPageEntries(connection, page_id, page_type, page_name, link_id).then(function(data) {
            mysql.forceConnectionRelease(connection);
            return resolve(page_id);
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

function addPageAuth(connection, page_id, user_id) {
  return new Promise(function(resolve, reject) {
    let query = "INSERT INTO `page_auth` (`page_id`, `user_id`, `page_POST`, `page_PUT`, `page_GET`, `page_DELETE`, `disabled`) VALUES (?, ?, 1, 1, 1, 1, 0)";
    let params = [
      page_id,
      user_id
    ];
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      return resolve();
    });
  });
}

function addDefaultPageEntries(connection, page_id, page_type, page_name, link_id) {
  return new Promise(function(resolve, reject) {
    getPageDefaults(connection, page_type).then(function(defaults) {
      setPageSummary(connection, page_id, page_type, page_name, defaults).then(function(data) {
        setPageContent(connection, page_id, defaults).then(function(data) {
          setPageLinks(connection, page_id, defaults).then(function(data) {
            setPageSpecials(connection, page_id, defaults).then(function(data) {
              updateParentPageLinks(connection, page_id, page_type, link_id).then(function(data) {
                resolve();
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
    let query = "SELECT `default_config` FROM `page_defaults` WHERE `type` = ? LIMIT 1";
    let params = [
      page_type
    ];
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      if (rows.length <= 0) {
        return reject({
          status: 500,
          message: `Page type ${page_type} is invalid.`
        });
      }
      return resolve(JSON.parse(rows[0]['default_config']));
    });
  });
}

function setPageSummary(connection, page_id, page_type, page_name, defaults) {
  let summary_default_text = getSummaryDefaultText(defaults);
  let summary_default_properties = getSummaryDefaultProperties(defaults);
  let query = "INSERT INTO `page_summary` (`page_id`, `type`, `name`, `text`, `properties`) VALUES (?, ?, ?, ? ,?)";
  let params = [
    page_id,
    page_type,
    page_name,
    summary_default_text,
    summary_default_properties
  ];
  return new Promise(function(resolve, reject) {
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      return resolve();
    });
  });
}

function getSummaryDefaultText(defaults) {
  if (!('summary' in defaults)) {
    return null;
  }
  let summary = defaults['summary'];
  if (!('text' in defaults)) {
    return null;
  }
  return summary['text'];
}

function getSummaryDefaultProperties(defaults) {
  if (!('summary' in defaults)) {
    return null;
  }
  let summary = defaults['summary'];
  if (!('properties' in defaults)) {
    return null;
  }
  return JSON.stringify(summary['properties']);
}

function setPageContent(connection, page_id, defaults) {
  return new Promise(function(resolve, reject) {
    setPageDefault('details', connection, page_id, defaults).then(function(data) {
      setPageDefault('images', connection, page_id, defaults).then(function(data) {
        setPageDefault('maps', connection, page_id, defaults).then(function(data) {
          resolve();
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

function setPageDefault(content_type, connection, page_id, defaults) {
  let type;
  if (content_type == 'details') {
    type = 'DE';
  } else if (content_type == 'images') {
    type = 'IM';
  } else {
    type = 'MP';
  }
  return new Promise(function(resolve, reject) {
    // @NOTE: no need to insert it into the table: the content cannot exist here (even in admin page settings).  This is for things like maps, which are specific to locations.
    if (!(content_type in defaults)) {
      return resolve();
    }
    let disabled = getDisabled(defaults, content_type);
    let properties = getProperties(defaults, content_type);
    let query = "INSERT INTO `page_content` (`page_id`, `type`, `properties`, `disabled`) VALUES (?, ?, ?, ?)";
    let params = [
      page_id,
      type,
      properties,
      disabled
    ];
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      return resolve();
    });
  });
}

function getDisabled(defaults, content_type) {
  if (!(content_type in defaults)) {
    return 0;
  }
  let content = defaults[content_type];
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
  let content = defaults[content_type];
  if (!('properties' in content)) {
    return null;
  }
  return content['properties'];
}

function setPageLinks(connection, page_id, defaults) {
  let pages = getPages(defaults);
  return new Promise(function(resolve, reject) {
    if (!pages || pages.length <= 0) {
      return resolve();
    }
    Promise.all(setPageLinkCalls(connection, page_id, pages)).then(function() {
      return resolve();
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
  let calls = [];
  for (let i = 0; i < pages.length; i++) {
    calls.push(setPageLink(connection, page_id, pages[i], i));
  }
  return calls;
}

function setPageLink(connection, page_id, page, order_index) {
  let type = getPageType(page);
  let properties = getPageProperties(page);
  return new Promise(function(resolve, reject) {
    if (!type) {
      reject({
        status: 500,
        message: "Page type not found in page default config"
      });
    }
    let query = "INSERT INTO `page_links` (`page_id`, `type`, `properties`, `order_index`) VALUES (?, ?, ?, ?)";
    let params = [
      page_id,
      type,
      properties,
      order_index
    ];
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      return resolve();
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

function setPageSpecials(connection, page_id, defaults) {
  return new Promise(function(resolve, reject) {
    // @TODO: not 100% certain how these will work yet: just return that we're good for now.
    return resolve();
  });
}

function updateParentPageLinks(connection, new_page_id, page_type, parent_link_id) {
  let list = [];
  return new Promise(function(resolve, reject) {
    if (!parent_link_id) {
      resolve();
    }
    let query = "INSERT INTO `page_id_bind` (`page_id`, `bound_id`, `type`, `order`) SELECT ?, ?, ?, CASE WHEN MAX(`order`) IS NOT NULL THEN MAX(`order`) + 1 ELSE 0 END AS `order` FROM `page_id_bind` WHERE `page_id` = ? AND type = ?";
    let params = [
      parent_link_id,
      new_page_id,
      page_type,
      parent_link_id,
      page_type
    ];
    connection.query(query, params, function(err, rows, fields) {
      if (mysql.queryError(err, connection)) {
        return reject(mysql.queryError(err, connection));
      }
      return resolve();
    });
  });
}

