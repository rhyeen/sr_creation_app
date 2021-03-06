let express = require("express");
let router = new express.Router();
let controller = require("./controller");
let statics = require("../../lib/statics").get();
let access = require("../../lib/middleware/access");
let auth = require("../../lib/middleware/auth");

module.exports = router;

router.route(statics.route_roots.map)
    .all(auth.verifyUser)
    .all(access.verifyUserHasAccess)
    .get(controller.getMap)
    .put(controller.createMap)
    .post(controller.updateMap)
    .delete(controller.deleteMap);
