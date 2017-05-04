module.exports = function(app, STATICS, helpers, Busboy, fs, path) {
  app.post(STATICS.route_roots.file, function (req, res) {
    var file_name = 'test.jpg';
    var target_path = path.resolve(STATICS.routes.private_images, file_name);
    var write_stream = fs.createWriteStream(target_path);
    var busboy = new Busboy({ headers: req.headers });
    // @TODO: need to handle the error cases.  1. when busboy fails 2. when write_stream fails 3. when data is not jpeg
    busboy.on('field', function(field_name, value, field_name_truncated, value_truncated, encoding, mimetype) {
      var data = value.replace(/^data:image\/jpeg;base64,/, "");
      write_stream.write(data, 'base64');
    });
    busboy.on('finish', function() {
      write_stream.end();
      res.send('Success');
    });
    req.pipe(busboy);
  });
};
