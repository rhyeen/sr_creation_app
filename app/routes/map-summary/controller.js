let model = require("./model");
let tools = require("../../lib/tools");
var exports = module.exports = {};

exports.updateMapSummary = function(req, res) {
  let page_id = req.page_id;
  if (!page_id || !req.params.mapId) {
    return res.status(400).send({
      message: 'Page id and Map id must be provided to update map summary'
    });
  }
  try {
    let map_name = getMapName(req);
    let summary_text = getMapSummaryText(req);
    let summary_properties = getMapSummaryProperties(req);
    model.updateMapSummary(page_id, map_id, map_name, summary_text, summary_properties).then(function() {
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

function getMapName(req) {
  let body = getBody(req);
  if ('name' in body && body['name']) {
    return body['name'];
  }
  throw getMissingBodyPropertyError('name');
}

function getMapSummaryText(req) {
  let map_summary = getMapSummary(req);
  if ('text' in map_summary && map_summary['text']) {
    return map_summary['text'];
  }
  throw getMissingBodyPropertyError('summary.text');
}

function getMapSummaryProperties(req) {
  let map_summary = getMapSummary(req);
  if ('properties' in map_summary && map_summary['properties']) {
    return map_summary['properties'];
  }
  throw getMissingBodyPropertyError('summary.properties');
}

function getMapSummary(req) {
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