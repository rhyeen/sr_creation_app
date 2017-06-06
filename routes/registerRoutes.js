module.exports = function(app) {
    let pageRoutes = require("./page/index.js");
    app.use(pageRoutes);
    let imageRoutes = require("./image/index.js");
    app.use(imageRoutes);
    let pageDetailRoutes = require("./page-detail/index.js");
    app.use(pageDetailRoutes);
    let pageImageRoutes = require("./page-image/index.js");
    app.use(pageImageRoutes);
    let pageLinksRoutes = require("./page-links/index.js");
    app.use(pageLinksRoutes);
    let pageSearchRoutes = require("./page-search/index.js");
    app.use(pageSearchRoutes);
    let pageSummaryRoutes = require("./page-summary/index.js");
    app.use(pageSummaryRoutes);
    let tagRoutes = require("./tag/index.js");
    app.use(tagRoutes);
};