let express = require("express");
let router = new express.Router();
let controller = require("./controller");
let statics = require("../../lib/statics").get();
let auth = require("../../lib/middleware/auth");
let access = require("../../lib/middleware/access");

module.exports = router;

router.route(statics.routes.page_detail)
    .all(auth.verifyUser)
    .all(access.verifyUserHasAccess)
    .post(controller.addDetail)
    .put(controller.updateDetail)
    .delete(controller.disableDetail);
