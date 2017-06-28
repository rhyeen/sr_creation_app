let STATICS = {
  route_endpoints: {
    default: "/open",
    secured: "/user",
    auth: "/auth",
    private_serve: "../private-serve"
  }
};

STATICS.route_roots = {
  page: STATICS.route_endpoints.secured + "/page",
  map: STATICS.route_endpoints.secured + "/map",
  file: STATICS.route_endpoints.secured + "/file",
  article: STATICS.route_endpoints.secured + "/article",
  tag: STATICS.route_endpoints.secured + "/tag",
  private_files: STATICS.route_endpoints.private_serve + "/files"
};

STATICS.routes = {
  page_summary: STATICS.route_roots.page + "/summary",
  page_detail: STATICS.route_roots.page + "/detail",
  page_links: STATICS.route_roots.page + "/page-links",
  page_image: STATICS.route_roots.page + "/image",
  healthcheck: STATICS.route_endpoints.default + "/healthcheck",
  render_tags: STATICS.route_roots.tag + "/render",
  page_search: STATICS.route_roots.page + "/search",
  map_search: STATICS.route_roots.map + "/search",
  map_image: STATICS.route_roots.map + "/map-image",
  image: STATICS.route_roots.file + "/image",
  thumbnail: STATICS.route_roots.file + "/image/thumbnail",
  private_images: STATICS.route_roots.private_files + "/images",
  private_thumbnails: STATICS.route_roots.private_files + "/thumbnails"
};

var exports = module.exports = {};

exports.get = function() {
  return STATICS;
};
