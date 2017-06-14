let model = require("./model");
let tools = require("../../lib/tools");
let statics = require("../../lib/statics").get();

let Busboy = require("busboy");
let path = require('path');
let fs = require('fs');
var exports = module.exports = {};

exports.getImage = function(req, res) {
  let target_directory = path.resolve(statics.routes.private_images);
  let file_name = req.params.image;
  model.getImage(target_directory, file_name).then(function(image_path) {
    res.sendFile(image_path);
    return;
  }, function(error) {
    tools.responseWithError(error, res, null);
    return;
  });
};

exports.getThumbnail = function(req, res) {
  let target_directory = path.resolve(statics.routes.private_thumbnails);
  let file_name = req.params.image;
  model.getImage(target_directory, file_name).then(function(image_path) {
    res.sendFile(image_path);
    return;
  }, function(error) {
    tools.responseWithError(error, res, null);
    return;
  });
};

exports.saveImage = function(req, res) {
  let target_directory = path.resolve(statics.routes.private_images);
  saveImageData(req, res, target_directory);
};

exports.saveThumbnail = function(req, res) {
  let target_directory = path.resolve(statics.routes.private_thumbnails);
  saveImageData(req, res, target_directory);
};

/**
 * @NOTE: for now, I cannot think of a clean way to put this into the model without passing 
 * in req and res.
 */
function saveImageData(req, res, target_directory) {
  try {
    let file_name = model.getFileName(target_directory);
    if (!file_name) {
      let err = {
        error: "UNIQUE_FILE_NAME_NOT_FOUND",
        message: "Unable to find a unique file name. This should be near impossible. Please try again.  If this error occurs again, please contact the development team."
      };
      tools.responseWithError(err, res, null);
      return;
    }
    let guessed_extension = '.jpg';
    let full_file_name = file_name + guessed_extension;
    let target_path = path.resolve(target_directory, full_file_name);
    let write_stream = fs.createWriteStream(target_path);
    let busboy = new Busboy({ headers: req.headers });
    // @TODO: need to handle the error cases.  1. when busboy fails 2. when write_stream fails
    busboy.on('field', function(field_name, value, field_name_truncated, value_truncated, encoding, mimetype) {
      let original_length = value.length;
      let data = value.replace(/^data:image\/jpeg;base64,/, "");
      // if nothing was replaced, it wasn't a jpeg image.
      if (original_length === data.length) {
        let data = value.replace(/^data:image\/png;base64,/, "");
        guessed_extension = '.png';
      }
      // we should technically have a case that handles if it is neither jpeg nor png,
      // but we can for now assume that there is no malicious behavior and that files
      // are being uploaded via the UI.
      write_stream.write(data, 'base64');
    });
    busboy.on('finish', function() {
      write_stream.end();
      if (guessed_extension !== '.jpg') {
        full_file_name = file_name + guessed_extension;
        let new_target_path = path.resolve(target_directory, full_file_name);
        fs.renameSync(target_path, new_target_path);
      }
      res.json({
        message: 'Success',
        file_name: full_file_name
      });
    });
    req.pipe(busboy);
  } catch (error) {
    console.error(error);
    let err = {
      message: "INTERNAL ERROR"
    };
    tools.responseWithError(err, res, null);
    return;
  }
}
