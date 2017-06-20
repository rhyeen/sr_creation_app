let model = require("./model");
let tools = require("../../lib/tools");
var exports = module.exports = {};

exports.getMaps = function(req, res) {
  if (!req.page_id) {
    error = {
      status: 400,
      message: "Page id must be provided to retrieve map."
    };
    tools.responseWithError(error, res, null);
    return;
  }
  model.getMaps(req.page_id).then(function(maps) {
    res.send(maps);
    return;
  }, function(error) {
    tools.responseWithError(error, res, null);
    return;
  });
}
