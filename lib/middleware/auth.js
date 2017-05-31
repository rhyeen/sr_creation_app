let Promise = require("bluebird")

let exports = module.exports = {};

exports.verifyUser = function(req, res, next) {
  req.user_id = 'US_1234567890123';
  next();
};