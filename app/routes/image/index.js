let express = require("express");
let router = new express.Router();
let controller = require("./controller");
let statics = require("../../lib/statics").get();
let auth = require("../../lib/middleware/auth");

module.exports = router;

router.route(statics.routes.image)
    .all(auth.verifyUser)
    .post(controller.saveImage);

router.route(statics.routes.image + '/:image')
    .all(auth.verifyUser)
    .get(controller.getImage);

router.route(statics.routes.thumbnail)
    .all(auth.verifyUser)
    .post(controller.saveThumbnail);

router.route(statics.routes.thumbnail + '/:image')
    .all(auth.verifyUser)
    .get(controller.getThumbnail);