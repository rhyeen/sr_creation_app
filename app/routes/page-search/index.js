let express = require("express");
let router = new express.Router();
let controller = require("./controller");
let statics = require("../../lib/statics").get();
let auth = require("../../lib/middleware/auth");

module.exports = router;

router.route(statics.routes.page_search)
    .all(auth.verifyUser)
    .get(controller.getSearchResults);
