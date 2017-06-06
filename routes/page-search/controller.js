let model = require("./model");
let tools = require("../../lib/tools");
var exports = module.exports = {};

exports.getSearchResults = function(req, res) {
  let user_id = req.user_id;
  try {
    let search_query = getSearchQuery(req);
    let search_type = getSearchType(req);
    model.getSearchResults(user_id, search_query, search_type).then(function(results) {
      res.send(results);
      return;
    }, function(error) {
      tools.responseWithError(error, res, null);
      return;
    });
  } catch (error) {
    tools.responseWithError(error, res, null);
    return;
  }
};

function getSearchQuery(req) {
  if (!req.query.query) {
    throw getMissingParamError('query');
  }
  return req.query.query;
}

function getSearchType(req) {
  if (!req.query.type) {
    throw getMissingParamError('type');
  }
  return req.query.type;
}

function getMissingParamError(param) {
  return {
    status: 400,
    message: `Missing required parameter ${param}.`
  };
}