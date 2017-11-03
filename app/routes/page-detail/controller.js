let model = require("./model");
let tagModel = require("../tag/model");
let tools = require("../../lib/tools");
var exports = module.exports = {};

exports.addDetail = function(req, res) {
  let page_id = req.page_id;
  try {
    let detail_name = getDetailName(req);
    let content_mark_down = getContentMarkdown(req);
    tagModel.findPartitions(content_mark_down).then(function(partitions) {
      tagModel.renderMarkdown(partitions).then(function(mark_down) {
        model.addDetail(page_id, detail_name, mark_down, partitions).then(function(detail_id) {
          return res.send({
            id: detail_id,
            content: {
              mark_down,
              partitions
            }
          });
        }, function(error) {
          tools.responseWithError(error, res, null);
          return;
        });
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

exports.updateDetail = function(req, res) {
  let page_id = req.page_id;
  try {
    let detail_id = getDetailId(req);
    let detail_name = getDetailName(req);
    let content_mark_down = getContentMarkdown(req);
    tagModel.findPartitions(content_mark_down).then(function(partitions) {
      tagModel.renderMarkdown(partitions).then(function(mark_down) {
        model.updateDetail(page_id, detail_id, detail_name, mark_down, partitions).then(function(data) {
          res.send({
            message: 'Success',
            content: {
              mark_down,
              partitions
            }
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
    }, function(error) {
      tools.responseWithError(error, res, null);
      return;
    });
  } catch (error) {
    tools.responseWithError(error, res, null);
    return;
  }
};

exports.disableDetail = function(req, res) {
  let page_id = req.page_id;
  try {
    let detail_id = getDetailId(req);
    model.disableDetail(page_id, detail_id).then(function(data) {
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

function getDetailId(req) {
  if (!req.query.detail) {
    throw getMissingParamError('detail');
  }
  return req.query.detail;
}

function getDetailName(req) {
  let body = getBody(req);
  if ('name' in body && body['name']) {
    return body['name'];
  }
  throw getMissingBodyPropertyError('name');
}

function getContentMarkdown(req) {
  let detail_content = getDetailContent(req);
  if ('mark_down' in detail_content) {
    return detail_content['mark_down'];
  }
  throw getMissingBodyPropertyError('content.mark_down');
}

function getContentPartitions(req) {
  let detail_content = getDetailContent(req);
  if ('partitions' in detail_content && detail_content['partitions']) {
    return detail_content['partitions'];
  }
  throw getMissingBodyPropertyError('content.partitions');
}

function getDetailContent(req) {
  let body = getBody(req);
  if ('content' in body && body['content']) {
    return body['content'];
  }
  throw getMissingBodyPropertyError('content');
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

function getMissingParamError(param) {
  return {
    status: 400,
    message: `Missing required parameter ${param}.`
  };
}

function getMissingBodyPropertyError(prop) {
  return {
    status: 400,
    message: `Missing required property from payload: ${prop}.`
  };
}