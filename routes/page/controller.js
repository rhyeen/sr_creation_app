var model = require("./model");
var tools = require("../../lib/tools");
var exports = module.exports = {};

exports.getPage = function(req, res) {
  model.forceGetPageId(req.page_id, req.user_id).then(function(page_id) {
    model.getPage(page_id).then(function(page) {
      res.send(page);
    }, function(error) {
      tools.responseWithError(error, res, null);
    });
  }, function(error) {
    tools.responseWithError(error, res, null);
  });
}

exports.createPage = function(req, res) {
  // model.retrieveMasterConfig(configId, jobId).then(function(data) {
  //   res.send(data);
  // }, function(error) {
  //   tools.responseWithError(error, res, null);
  // });
}

exports.updatePage = function(req, res) {
  // model.retrieveMasterConfig(configId, jobId).then(function(data) {
  //   res.send(data);
  // }, function(error) {
  //   tools.responseWithError(error, res, null);
  // });
}

exports.deletePage = function(req, res) {
  // model.retrieveMasterConfig(configId, jobId).then(function(data) {
  //   res.send(data);
  // }, function(error) {
  //   tools.responseWithError(error, res, null);
  // });
}
