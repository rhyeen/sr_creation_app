let model = require("./model");
let tools = require("../../lib/tools");
var exports = module.exports = {};

exports.renderTags = function(req, res) {
  try {
    let mark_down = getMarkDown(req);
    model.findPartitions(mark_down).then(function(partitions) {
      model.renderMarkdown(partitions).then(function(new_mark_down) {
        res.send({
          mark_down: new_mark_down,
          partitions: partitions
        });
        return;
      }, function(error) {
        tools.responseWithError(error, res, null);
        return;
      });
    }, function(error) {
      tools.responseWithError(error, res, null);
      return;
    });
  } catch (error) {
    tools.responseWithError(error, res, null);
    return;
  }
};

function getMarkDown(req) {
  let body = getBody(req);
  if ('mark_down' in body && body['mark_down']) {
    return body['mark_down'];
  }
  throw getMissingBodyPropertyError('mark_down');
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