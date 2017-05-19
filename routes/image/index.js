module.exports = function(app, STATICS, helpers, Busboy, fs, path) {
  app.post(STATICS.routes.image, function (req, res) {
    var target_directory = path.resolve(STATICS.routes.private_images);
    saveImage(req, res, target_directory);
  });

  app.post(STATICS.routes.thumbnail, function (req, res) {
    var target_directory = path.resolve(STATICS.routes.private_thumbnails);
    saveImage(req, res, target_directory);
  });

  app.get(STATICS.routes.image + '/:image', function (req, res) {
    var target_directory = path.resolve(STATICS.routes.private_images);
    getImage(req, res, target_directory);
  });

  app.get(STATICS.routes.thumbnail + '/:image', function (req, res) {
    var target_directory = path.resolve(STATICS.routes.private_thumbnails);
    getImage(req, res, target_directory);
  });

  function saveImage(req, res, target_directory) {
    var file_name = getFileName(target_directory);
    if (!file_name) {
      console.error("UNIQUE_FILE_NAME_NOT_FOUND");
      res.status(500).send({
        error: "UNIQUE_FILE_NAME_NOT_FOUND",
        message: "Unable to find a unique file name. This should be near impossible. Please try again.  If this error occurs again, please contact the development team."
      });
    }
    var guessed_extension = '.jpg';
    var full_file_name = file_name + guessed_extension;
    var target_path = path.resolve(target_directory, full_file_name);
    var write_stream = fs.createWriteStream(target_path);
    var busboy = new Busboy({ headers: req.headers });
    // @TODO: need to handle the error cases.  1. when busboy fails 2. when write_stream fails
    busboy.on('field', function(field_name, value, field_name_truncated, value_truncated, encoding, mimetype) {
      var original_length = value.length;
      var data = value.replace(/^data:image\/jpeg;base64,/, "");
      // if nothing was replaced, it wasn't a jpeg image.
      if (original_length === data.length) {
        var data = value.replace(/^data:image\/png;base64,/, "");
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
        var new_target_path = path.resolve(target_directory, full_file_name);
        fs.renameSync(target_path, new_target_path);
      }
      res.json({
        message: 'Success',
        file_name: full_file_name
      });
    });
    req.pipe(busboy);
  }

  function getFileName(target_directory) {
    return getFileNameRecurse(target_directory, 0);
  }

  function getFileNameRecurse(target_directory, retries) {
    if (retries > helpers.constant['MAX_ID_GENERATION_RETRIES']) {
      return null;
    }
    var file_name = helpers.generator.generateId();
    if (fs.existsSync(path.resolve(target_directory, file_name + ".jpg"))) {
      return getFileNameRecurse(target_directory, retries + 1);
    } else if (fs.existsSync(path.resolve(target_directory, file_name + ".png"))) {
      return getFileNameRecurse(target_directory, retries + 1);
    }
    return file_name;
  }

  function getImage(req, res, target_directory) {
    var file_name = req.params.image;
    var target_path = path.resolve(target_directory, file_name);
    res.sendFile(target_path);
  }
};
