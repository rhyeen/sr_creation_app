let model = require("./model");
let tools = require("../../lib/tools");
var exports = module.exports = {};

exports.getPage = function(req, res) {
  model.forceGetPageId(req.page_id, req.user_id).then(function(page_id) {
    model.getPage(page_id).then(function(page) {
      return res.send(page);
    }, function(error) {
      return tools.responseWithError(error, res, null);
    });
  }, function(error) {
    return tools.responseWithError(error, res, null);
  });
}

exports.createPage = function(req, res) {
  let link_id = req.query.link;
  let query_page_type = req.query.type;
  let page_type = validatePageType(query_page_type);
  let page_name = req.query.name;
  let user_id = req.user_id;
  if (!page_type) {
    return res.status(400).send(`Page type: ${query_page_type} is unsupported.`);
  }
  model.createPage(link_id, page_type, page_name, user_id).then(function(page_id) {
    return res.send(page_id);
  }, function(error) {
    return tools.responseWithError(error, res, null);
  });
}

exports.updatePage = function(req, res) {
  let pages = getRelatedPages(req);
  pages.forEach(page => {
    if (!page['type']) {
      return res.status(400).send(`Page does not contain required "type" property.`);
    }
    if (!validatePageType(page['type'])) {
      return res.status(400).send(`Page type: ${page['type']} is unsupported.`);
    }
    if (page['properties'] && page['properties']['list']) {
      return res.status(400).send(`Page properties cannot contain "list" property when updating order.`);
    }
  });
  let page_id = req.page_id;
  model.updateRelatedPagesOrder(pages, page_id)
  .then(() => res.send('Success'), error => tools.responseWithError(error, res, null));
}

exports.deletePage = function(req, res) {
  model.forceGetPageId(req.page_id, req.user_id).then(function(page_id) {
    model.deletePage(page_id).then(function() {
      return res.send('Success');
    }, function(error) {
      return tools.responseWithError(error, res, null);
    });
  }, function(error) {
    return tools.responseWithError(error, res, null);
  });
}

function validatePageType(page_type) {
  if (!page_type || page_type.length != 2) {
    return null;
  }
  return page_type;
}

function getRelatedPages(req) {
  let body = getBody(req);
  if ('pages' in body && body['pages']) {
    return body['pages'];
  }
  throw getMissingBodyPropertyError('pages');
}

function getBody(req) {
  if (!req.body) {
    throw {
      status: 400,
      message: 'Missing required request payload.'
    };
  }
  return req.body;
}

function getMissingBodyPropertyError(prop) {
  return {
    status: 400,
    message: `Missing required property from payload: ${prop}.`
  };
}
