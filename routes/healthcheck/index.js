module.exports = function(app, STATICS) {
  app.get(STATICS.routes.healthcheck, function(req, res) {
    res.send({
      status: 'ok'
    });
  });
};