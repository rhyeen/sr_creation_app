let Promise = require("bluebird")
let mysql = require("../mysql-connection");
let tools = require("../tools");

var exports = module.exports = {};

exports.verifyUserHasAccess = function(req, res, next) {
  try {
    let user_id = getUserId(req);
    let page_id = getPageId(req);
    console.log(`page id: ${page_id}`);
    console.log(`user id: ${user_id}`);
    if (!page_id) {
      // nothing to verify: the user can access a null page.
      next();
      return;
    }
    let request_method = getRequestMethod(req);
    if (isMap(page_id)) {
      checkMapAuth(request_method, user_id, page_id).then(function(data) {
        req.map_id = page_id;
        next();
        return;
      }, function(error) {
        tools.responseWithError(error, res, null);
        return;
      });
    } else {
      req.page_id = page_id;
      checkPageAuth(request_method, user_id, page_id).then(function(data) {
        next();
        return;
      }, function(error) {
        tools.responseWithError(error, res, null);
        return;
      });
    }
  } catch (err) {
    let error = {
      status: 400,
      message: err.message
    };
    tools.responseWithError(error, res, null);
    return;
  }
};

function getUserId(req) {
  let user_id = req.user_id;
  if (!user_id) {
    let error = "No User Id found. Make sure to authenticate before calling this middleware.";
    console.error(error);
    throw new Error(error);
  }
  return user_id;
}

function getPageId(req) {
  // if none, then there is nothing to verify access against, and the user is most likely creating a new page.
  return req.query.id;
}

function isMap(id) {
  return id.startsWith("MP");
}

function getRequestMethod(req) {
  let request_method = req.method;
  if (!request_method) {
    throw new Error("Unable to extract request method.");
  }
  return request_method;
}

function checkPageAuth(request_method, user_id, page_id) {
  return new Promise(function(resolve, reject) {
    let method_column = `page_${request_method}`;
    let query = "SELECT `" + method_column + "` FROM `page_auth` WHERE `user_id` = ? AND `page_id` = ? AND `disabled` != 1 LIMIT 1";
    let params = [
      user_id,
      page_id
    ];
    mysql.getConnection(function(err, connection) {
      if (mysql.connectionError(err, connection)) {
        return reject(mysql.connectionError(err, connection));
      }
      connection.query(query, params, function(err, rows, fields) {
        if (mysql.queryError(err, connection)) {
          return reject(mysql.queryError(err, connection));
        }
        mysql.forceConnectionRelease(connection);
        if (rows.length <= 0) {
          return reject({
            status: 400,
            message: "User does not have permissions."
          });
        }
        return resolve();
      });
    });
  });
};

function checkMapAuth(request_method, user_id, map_id) {
  return new Promise(function(resolve, reject) {
    console.log("@TODO: map ids not verified");
    return resolve();
  });
};