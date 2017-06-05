let tools = require("../../lib/tools");
let constants = require("../../lib/constants").get();
let path = require('path');
let fs = require('fs');

let Promise = require("bluebird");

var exports = module.exports = {};

exports.getImage = function(target_directory, file_name) {
  return new Promise(function(resolve, reject) {
    if (!file_name) {
      return reject({
        status: 400,
        message: "Image name must be provided in URL."
      });
    }
    return resolve(path.resolve(target_directory, file_name));
  });
};

exports.getFileName = function(target_directory) {
  return getFileNameRecurse(target_directory, 0);
}

getFileNameRecurse = function(target_directory, retries) {
  if (retries > constants.MAX_ID_GENERATION_RETRIES) {
    return null;
  }
  var file_name = tools.generateId();
  if (fs.existsSync(path.resolve(target_directory, file_name + ".jpg"))) {
    return getFileNameRecurse(target_directory, retries + 1);
  } else if (fs.existsSync(path.resolve(target_directory, file_name + ".png"))) {
    return getFileNameRecurse(target_directory, retries + 1);
  }
  return file_name;
}