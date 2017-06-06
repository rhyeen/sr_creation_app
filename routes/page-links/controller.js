let model = require("./model");
let tools = require("../../lib/tools");
var exports = module.exports = {};

exports.updatePageLinks = function(req, res) {
  let page_id = req.page_id;
  try {
    let page_links = getPageLinks(req);
    model.updatePageLinks(page_id, page_links).then(function(data) {
      res.send('Success');
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

function getPageLinks(req) {
  let body = getBody(req);
  if ('links' in body && body['links']) {
    return body['links'];
  }
  throw getMissingBodyPropertyError('links');
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