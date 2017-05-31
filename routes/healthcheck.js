let express = require("express");
let statics = require("../lib/statics");
let router = new express.Router();

module.exports = router;

router.get(statics.routes.healthcheck, function(req, res) {
  res.json({
    status: "ok"
  });
});
