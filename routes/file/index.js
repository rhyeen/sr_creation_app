module.exports = function(app, STATICS, helpers, formidable, fs, path) {
  app.post(STATICS.route_roots.file, function (req, res) {
    var form = new formidable.IncomingForm(),
        relative_to_here = '../',
        image_directory = STATICS.routes.private_images,
        file_name = 'test.jpg',
        target_directory = path.resolve(relative_to_here, image_directory);
    console.log("TARGET:" + target_directory);
    form.uploadDir = target_directory;

    form.on('file', function(field, file) {
      console.log("FILE FOUND");
      var extension = path.extname(file.name).toLowerCase();
      if (extension === '.png' || extension === '.jpg' || extension === 'jpeg') {
        fs.renameSync(file.path, path.join(form.uploadDir, file_name));
      } else {
        fs.unlinkSync(file.path);
        res.status(400);
        res.send('Invalid image type: ' + extension);
        return;
      }
    });

    form.on('error', function(err) {
      console.log("FILE ERROR");
      if (err) {
        console.log('An error occurred during the upload: ' + err);
        res.status(500);
        res.send('Unexpected error: unable to upload image.');
      }
    });

    form.on('end', function() {
      console.log("FILE END");
      res.send('Success');
    });

    form.parse(req);
  });
};
