let model = require("./model");
let tools = require("../../lib/tools");
var exports = module.exports = {};

exports.updatePageSummary = function(req, res) {
  let page_id = req.page_id;
  try {
    let page_name = getPageName(req);
    let summary_text = getPageSummaryText(req);
    let summary_properties = getPageSummaryProperties(req);
    model.updatePageSummary(page_id, page_name, summary_text, summary_properties).then(function(data) {
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

function getPageName(req) {
  let body = getBody(req);
  if ('name' in body && body['name']) {
    return body['name'];
  }
  throw getMissingBodyPropertyError('name');
}

function getPageSummaryText(req) {
  let page_summary = getPageSummary(req);
  if ('text' in page_summary && page_summary['text']) {
    return page_summary['text'];
  }
  throw getMissingBodyPropertyError('sumamry.text');
}

function getPageSummaryProperties(req) {
  let page_summary = getPageSummary(req);
  if ('properties' in page_summary && page_summary['properties']) {
    return page_summary['properties'];
  }
  throw getMissingBodyPropertyError('sumamry.properties');
}

function getPageSummary(req) {
  let body = getBody(req);
  if ('summary' in body && body['summary']) {
    return body['summary'];
  }
  throw getMissingBodyPropertyError('summary');
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