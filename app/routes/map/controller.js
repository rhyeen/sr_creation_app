let get_map_model = require("./get-map-model");
let create_map_model = require("./create-map-model");
let delete_map_model = require("./delete-map-model");
let tools = require("../../lib/tools");
var exports = module.exports = {};

exports.getMap = function(req, res) {
  if (!req.map_id) {
    error = {
      status: 400,
      message: "Map id must be provided to retrieve a map."
    };
    return tools.responseWithError(error, res, null);
  }
  get_map_model.getMap(req.map_id).then(function(map) {
    return res.send(map);
  }, function(error) {
    return tools.responseWithError(error, res, null);
  });
}

exports.updateMap = function(req, res) {
  error = {
    status: 404,
    message: "There is no endpoint to update a map. Instead, update each map element individually."
  };
  return tools.responseWithError(error, res, null);
}

exports.createMap = function(req, res) {
  if (!req.page_id) {
    error = {
      status: 400,
      message: "Page id must be provided to create a map."
    };
    return tools.responseWithError(error, res, null);
  }
  create_map_model.createMap(req.page_id, req.body).then(function(map_id) {
    return res.send({id: map_id});
  }, function(error) {
    return tools.responseWithError(error, res, null);
  });
}

exports.deleteMap = function(req, res) {
  if (!req.page_id || !req.params.mapId) {
    error = {
      status: 400,
      message: "Page id and Map id must be provided to delete a map."
    };
    return tools.responseWithError(error, res, null);
  }
  delete_map_model.deleteMap(req.page_id, req.params.mapId).then(function() {
    return res.send('Success');
  }, function(error) {
    return tools.responseWithError(error, res, null);
  });
}