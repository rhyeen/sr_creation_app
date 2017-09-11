let model = require("./model");
let tools = require("../../lib/tools");
var exports = module.exports = {};

exports.getPage = function(req, res) {
  model.forceGetPageId(req.page_id, req.user_id).then(function(page_id) {
    model.getPage(page_id).then(function(page) {
      res.send(page);
      return;
    }, function(error) {
      tools.responseWithError(error, res, null);
      return;
    });
  }, function(error) {
    tools.responseWithError(error, res, null);
    return;
  });
}

exports.createPage = function(req, res) {
  let link_id = req.query.link;
  let query_page_type = req.query.type;
  let page_type = validatePageType(query_page_type);
  let page_name = req.query.name;
  let user_id = req.user_id;
  if (!page_type) {
    res.status(400).send(`Page type: ${query_page_type} is unsupported.`);
    return;
  }
  model.createPage(link_id, page_type, page_name, user_id).then(function(page_id) {
    res.send(page_id);
    return;
  }, function(error) {
    tools.responseWithError(error, res, null);
    return;
  });
}

exports.updatePage = function(req, res) {
  error = {
    status: 404,
    message: "There is no endpoint to update a page. Instead, update each page element individually."
  };
  return tools.responseWithError(error, res, null);
}

exports.deletePage = function(req, res) {
  model.forceGetPageId(req.page_id, req.user_id).then(function(page_id) {
    model.deletePage(page_id).then(function() {
      res.send('Success');
      return;
    }, function(error) {
      tools.responseWithError(error, res, null);
      return;
    });
  }, function(error) {
    tools.responseWithError(error, res, null);
    return;
  });
}

function validatePageType(page_type) {
  if (!page_type || page_type.length != 2) {
    return null;
  }
  return page_type;
}
