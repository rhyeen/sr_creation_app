let model = require("./model");
let tools = require("../../lib/tools");
var exports = module.exports = {};

exports.addImage = function(req, res) {
  let page_id = req.page_id;
  try {
    let map_id = getMapId(req);
    let image_name = getImageName(req);
    let image_caption = getImageCaption(req);
    let image_source = getImageSource(req);
    let image_link = getImageLink(req);
    let thumbnail_link = getThumbnailLink(req);
    model.verifyPageHasAccess(page_id, map_id).then(() => {
      model.addImage(map_id, image_name, image_caption, image_source, image_link, thumbnail_link).then(function(image_id) {
        res.send(image_id);
        return;
      }, function(error) {
        tools.responseWithError(error, res, null);
        return;
      });
    }, error => {
      tools.responseWithError(error, res, null);
      return;
    });
  } catch (error) {
    tools.responseWithError(error, res, null);
    return;
  }
};

exports.updateImage = function(req, res) {
  let page_id = req.page_id;
  try {
    let image_id = getImageId(req);
    let image_name = getImageName(req);
    let image_caption = getImageCaption(req);
    let image_source = getImageSource(req);
    let image_link = getImageLink(req);
    let thumbnail_link = getThumbnailLink(req);
    model.verifyPageHasAccess(page_id, map_id).then(() => {
      model.updateImage(map_id, image_id, image_name, image_caption, image_source, image_link, thumbnail_link).then(function(data) {
        res.send('Success');
        return;
      }, function(error) {
        tools.responseWithError(error, res, null);
        return;
      });
    }, error => {
      tools.responseWithError(error, res, null);
      return;
    });
  } catch (error) {
    tools.responseWithError(error, res, null);
    return;
  }
};

exports.deleteImageLink = function(req, res) {
  let page_id = req.page_id;
  try {
    let image_id = getImageId(req);
    model.verifyPageHasAccess(page_id, map_id).then(() => {
      model.disableImage(map_id, image_id).then(function(data) {
        res.send('Success');
        return;
      }, function(error) {
        tools.responseWithError(error, res, null);
        return;
      });
    }, error => {
      tools.responseWithError(error, res, null);
      return;
    });
  } catch (error) {
    tools.responseWithError(error, res, null);
    return;
  }
};

function getMapId(req) {
  if (!req.query.map) {
    throw getMissingParamError('map');
  }
  return req.query.map;
}

function getImageId(req) {
  if (!req.query.image) {
    throw getMissingParamError('image');
  }
  return req.query.image;
}

function getImageName(req) {
  let body = getBody(req);
  if ('name' in body && body['name']) {
    return body['name'];
  }
  throw getMissingBodyPropertyError('name');
}

function getImageSource(req) {
  let body = getBody(req);
  if ('source' in body && body['source']) {
    return body['source'];
  }
  throw getMissingBodyPropertyError('source');
}

function getImageCaption(req) {
  let body = getBody(req);
  if ('caption' in body && body['caption']) {
    return body['caption'];
  }
  throw getMissingBodyPropertyError('caption');
}

function getImageLink(req) {
  let body = getBody(req);
  if ('link' in body && body['link']) {
    return body['link'];
  }
  throw getMissingBodyPropertyError('link');
}

function getThumbnailLink(req) {
  let image_thumbnail = getImageThumbnail(req);
  if ('link' in image_thumbnail) {
    return image_thumbnail['link'];
  }
  throw getMissingBodyPropertyError('thumbnail.link');
}

function getImageThumbnail(req) {
  let body = getBody(req);
  if ('thumbnail' in body && body['thumbnail']) {
    return body['thumbnail'];
  }
  throw getMissingBodyPropertyError('thumbnail');
}

function getBody(req) {
  if (!req.body) {
    throw {
      status: 400,
      message: 'Missing required request payload.'
    };
  }
  return req.body;
}

function getMissingParamError(param) {
  return {
    status: 400,
    message: `Missing required parameter ${param}.`
  };
}

function getMissingBodyPropertyError(prop) {
  return {
    status: 400,
    message: `Missing required property from payload: ${prop}.`
  };
}