let express = require("express");
let router = new express.Router();
let controller = require("./controller");
let statics = require("../../lib/statics").get();

module.exports = router;

router.route(statics.routes.render_tags)
    .post(controller.renderTags);
