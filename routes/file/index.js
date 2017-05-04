module.exports = function(app, STATICS, helpers, Busboy, fs, path, os) {
  app.post(STATICS.route_roots.file, function (req, res) {
    var relative_to_here = '../',
        image_directory = STATICS.routes.private_images,
        file_name = 'test.jpg',
        target_directory = path.resolve(relative_to_here, image_directory);
    console.log("TARGET:" + target_directory);
    // var form = new formidable.IncomingForm();
    // form.uploadDir = target_directory;

    // form.on('file', function(field, file) {
    //   console.log("FILE FOUND");
    //   var extension = path.extname(file.name).toLowerCase();
    //   if (extension === '.png' || extension === '.jpg' || extension === 'jpeg') {
    //     fs.renameSync(file.path, path.join(form.uploadDir, file_name));
    //   } else {
    //     fs.unlinkSync(file.path);
    //     res.status(400);
    //     res.send('Invalid image type: ' + extension);
    //     return;
    //   }
    // });

    // form.on('error', function(err) {
    //   console.log("FILE ERROR");
    //   if (err) {
    //     console.log('An error occurred during the upload: ' + err);
    //     res.status(500);
    //     res.send('Unexpected error: unable to upload image.');
    //   }
    // });

    // form.on('end', function() {
    //   console.log("FILE END");
    //   res.send('Success');
    // });

    // form.parse(req);
    var busboy = new Busboy({ headers: req.headers });
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
      file.on('data', function(data) {
        console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
      });
      file.on('end', function() {
        console.log('File [' + fieldname + '] Finished');
      });
    });
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      console.log('Field [' + fieldname + ']: value: ' + val);
    });
    busboy.on('finish', function() {
      console.log('Done parsing form!');
      res.writeHead(303, { Connection: 'close', Location: '/' });
      res.end();
    });
    req.pipe(busboy);
  });
};
