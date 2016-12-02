module.exports = function(app, STATICS, helpers, Promise, pool) {

  function getCode(article) {
    var id = getId(article);
    var page_code = id.substring(0,2);
    return page_code.toUpperCase();
  }

  function getId(article) {
    return article['id'];
  }

  function setId(article, id) {
    article['id'] = id;
  }

  function getAbbr(article) {
    var code = getCode(article);
    return code.toLowerCase();
  }

  function validPageType(page) {
    // @TODO: convet to an `id_config` look-up... maybe.  Should exclude RR and US as they are not page types.  This table may contain other ids as well later.
    var valid_types = ["CA", "CH", "CR", "EN", "IT", "LO", "PL", "QU", "SH", "ST"];
    var code = getCode(page);
    return valid_types.indexOf(code) >= 0;
  }

  function setArticleDetails(connection, req, article, owner_id, res) {
    return new Promise(function(resolve, reject) {
      if (!req || !req.query || !req.query.id) {
        return reject({
          status: 400,
          message: "Id must be provided."
        });
      }
      var id = req.query.id;
      setId(article, id);
      var abbr = getAbbr(article);
      if (getId(article).length != helpers.constant.PAGE_ID_LENGTH) {
        return reject({
          status: 400,
          message: "Invalid Id provided."
        });
      }
      if (!validPageType(article)) {
        return reject({
          status: 400,
          message: "{0} is not a valid Id type.".format(id)
        });
      }
      var query = "SELECT `{0}_summary`.`name` AS name \
      FROM `{0}_summary`, `{0}_details` \
      WHERE `{0}_summary`.`id` = ? AND `{0}_details`.`id` = ?";
      query = query.format(abbr);
      connection.query(query, [id, id], function(err, rows, fields) {
        if (helpers.connection.queryError(err, connection)) {
          return reject({
            status: 500,
            message: "Query failed unexpectedly."
          });
        }

        if (rows.length <= 0) {
          return reject({
            status: 500,
            message: "Could not find extry for {0} in the database.".format(id)
          });
        }

        article['name'] = rows[0]['name'];

        return resolve({
          article: article
        });
      });
    });
  }

  function responseWithError(error, res) {
    var status = 500;
    var message = error;
    if ('status' in error) {
      status = error['status'];
    }
    if ('message' in error) {
      message = error['message'];
    }
    res.status(status).send(message);
  }

  app.get(STATICS.routes.overview_article, function(req, res) {
    var mock_article = {
      name: "The Standing Pony",
      type: "Inn",
      owner: {
        id: "CH_1234567890123",
        name: "Barken Caderran"
      },
      part_of: {
        id: "LO_1234567890123",
        name: "Telenor"
      },
      description: {
        details: [
          {
            id: "DE_1234567890123",
            name: "Overview",
            content: "A ruined old building that has been barely kept in one piece.  The door is a thick iron door, one that seems taken from a long lost dungeon (it has, in fact, been taken from Dallon Row's catacombs).  The place has a secret room in the basement that houses a family of Fey Goblins.",
            content_tags: [
              {
                start: 14,
                end: 20,
                id: 'LO_1234567890124'
              }
            ]
          },
          {
            id: "DE_1234567890124",
            name: "At the mantel",
            content: "There is a small decoration of a fat cat with wings.",
            content_tags: []
          }
        ]
      },
      relative_pages_sections: [
        {
          name: "Quests",
          relative_pages: [
            {
              name: "Curse of the chicken foot"
            },
            {
              name: "Vox Machina",
              summary: "Players are expected to take the left path at the Crow's crossing.  If they take the right, they will be taken through the woods of dread's love and to Lady Giga's haunted house.  There, they will most certainly meet their doom as Giga likes to eat adventurers"
            },
            {
              name: "Big content",
              summary: "Players are expected to take the left path at the Crow's crossing.  If they take the right, they will be taken through the woods of dread's love and to Lady Giga's haunted house.  There, they will most certainly meet their doom as Giga likes to eat adventurers"
            }
          ]
        },
        {
          name: "Characters",
          relative_pages: [
            {
              name: "Curse of the chicken foot"
            },
            {
              name: "Vox Machina",
              summary: "This is a test summary"
            },
            {
              name: "Big content",
              summary: "Players are expected to take the left path at the Crow's crossing.  If they take the right, they will be taken through the woods of dread's love and to Lady Giga's haunted house.  There, they will most certainly meet their doom as Giga likes to eat adventurers"
            }
          ]
        }
      ]
    }
    res.send(mock_article);
    return;


    var owner_id = 'US_1234567890123';
    var article = {};
    pool.getConnection(function(err, connection) {
      if (helpers.connection.connectionError(err, connection, res)) {
        return;
      }      
      setArticleDetails(connection, req, article, owner_id, res).then(function(data) {
        if (connection) {
          connection.release();
        }
        res.send(article);
      }, function(error) {
        responseWithError(error, res);
      });
    });
  });
};
