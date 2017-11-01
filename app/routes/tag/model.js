let tools = require("../../lib/tools");

let Promise = require("bluebird");

var exports = module.exports = {};

exports.findPartitions = function(mark_down) {
  return new Promise(function(resolve, reject) {
    var partitions = [];
    if (!mark_down) {
      return partitions;
    }
    mark_down = cleanMarkdown(mark_down);
    recurseFindPartitions(mark_down, -1, partitions);
    return resolve(partitions);
  });
};

function cleanMarkdown(mark_down) {
  return mark_down.replace(/(\r\n|\n|\r)/gm,"\n");
}

exports.renderMarkdown = function(partitions) {
  return new Promise(function(resolve, reject) {
    var i, text, partition;
    var mark_down_texts = [];
    for (i = 0; i < partitions.length; i++) {
      partition = partitions[i];
      text = partition.text;
      mark_down_texts.push(addAdditionalText(text, partition));
    }
    return resolve(mark_down_texts.join(''));
  });
};

function recurseFindPartitions(mark_down, index_marker, partitions) {
  var opening_tag,
      closing_tag,
      last_index;
  opening_tag = findNextOpeningTag(mark_down, index_marker);
  closing_tag = findNextClosingTag(mark_down, opening_tag);
  // special case if there are no tags
  if (opening_tag == -1 || closing_tag == -1) {
    last_index = mark_down.length - 1;
    addTextPartition(partitions, mark_down, index_marker, last_index);
    return;
  }
  // in the case where there is text before the tag
  if (opening_tag > 0) {
    addTextPartition(partitions, mark_down, index_marker, opening_tag - 1);
  }
  index_marker = addTagPartition(partitions, mark_down, opening_tag, closing_tag);
  return recurseFindPartitions(mark_down, index_marker, partitions);
}

function findNextOpeningTag(text, index_marker) {
  return text.indexOf('{', index_marker);
}

function findNextClosingTag(text, opening_tag) {
  return text.indexOf('}', opening_tag);
}

function addTextPartition(partitions, mark_down, index_marker, last_index) {
  var text,
      textPartitions = [];
  text = getInBetweenText(mark_down, index_marker, last_index + 1);
  recurseFindTextPartitions(text, textPartitions);
  partitions.push.apply(partitions, textPartitions);
}

function recurseFindTextPartitions(text, textPartitions) {
  if (!text) {
    return;
  }
  const nextMarkdownIndicator = getNextMarkdownIndicator(text);
  // no special markdown: just plain text
  if (!nextMarkdownIndicator) {
    textPartitions.push({
      type: 'text',
      text: text
    });
    return;
  }
  if (nextMarkdownIndicator.startIndex > 0) {
    textPartitions.push({
      type: 'text',
      text: text.substring(0, nextMarkdownIndicator.startIndex)
    });
  }
  textPartitions.push({
    type: nextMarkdownIndicator.type,
    text: nextMarkdownIndicator.text
  });
  if (nextMarkdownIndicator.endIndex === text.length - 1) {
    return;
  }
  text = text.substring(nextMarkdownIndicator.endIndex + 1);
  return recurseFindTextPartitions(text, textPartitions);
}

function getNextMarkdownIndicator(text) {
  var closestMarkdownIndicator,
      possibleMarkdownIndicator;
  closestMarkdownIndicator = getLineBreakIndicator(text);
  // START repeat: for every new type of indicator
  possibleMarkdownIndicator = getHeaderIndicator(text);
  if (possibleMarkdownIndicator && !closestMarkdownIndicator) {
    closestMarkdownIndicator = possibleMarkdownIndicator;
  } else if (possibleMarkdownIndicator && possibleMarkdownIndicator.startIndex < closestMarkdownIndicator.startIndex) {
    closestMarkdownIndicator = possibleMarkdownIndicator;
  }
  // END repeat
  return closestMarkdownIndicator;
}

function getLineBreakIndicator(text) {
  var index = text.indexOf("\n");
  if (index === -1) {
    return null;
  }
  return {
    startIndex: index,
    endIndex: index,
    type: 'break',
    text: "\n"
  };
}

function getHeaderIndicator(text) {
  // @TODO:
  return null;
  /* The reason why the only valid header indicator would be if it was
     at the start of text is because the header has to either be
     A) the first characters in the start of the mark_down or
     B) the first characters immediately preceeding a linebreak (possible excluding spaces?)

     Both A) and B) are a little challenging to prove. To prove (A), we could pass the original markdown down to check it.  To prove (B), we could pass the textPartitions to see if the latest was a 'break' type.
  */
  // var index = text.indexOf("# ");
  // if (index !== 0) {
  //   return null;
  // }
  // return {
  //   startIndex: 0,
  //   endIndex: 1
  //   type: 'h1'
  // };
}

function addTagPartition(partitions, mark_down, opening_tag, closing_tag) {
  var text,
      tag_id,
      tag_content,
      partition;
  text = getInBetweenText(mark_down, opening_tag, closing_tag);
  tag_id = getTagId(mark_down, closing_tag);
  if (!tag_id) {
    tag_id = createNewTagId();
  }
  tag_content = getTagContent();
  partition = {
    type: 'tag',
    text: text,
    id: tag_id,
    tag: tag_content
  };
  partitions.push(partition);
  return getIndexMarker(mark_down, closing_tag);
}

function getInBetweenText(mark_down, opening_tag, closing_tag) {
  return mark_down.substring(opening_tag + 1, closing_tag);
}

function getTagId(mark_down, closing_tag) {
  var opening_identifier,
      closing_identifier;
  opening_identifier = getOpeningIdentifier(mark_down, closing_tag);
  if (opening_identifier == -1) {
    return null;
  }
  closing_identifier = getClosingIdentifier(mark_down, opening_identifier);
  if (closing_identifier == -1) {
    return null;
  }
  return getInBetweenText(mark_down, opening_identifier, closing_identifier);
}

function getOpeningIdentifier(text, closing_tag) {
  var next_index = closing_tag + 1
  if (text.length <= next_index || text[next_index] != '(') {
    return -1;
  }
  return next_index;
}

function getClosingIdentifier(text, opening_identifier) {
  return text.indexOf(')', opening_identifier);
}

function getIndexMarker(mark_down, closing_tag) {
  var opening_identifier,
      closing_identifier;
  opening_identifier = getOpeningIdentifier(mark_down, closing_tag);
  if (opening_identifier == -1) {
    return closing_tag;
  }
  closing_identifier = getClosingIdentifier(mark_down, opening_identifier);
  if (closing_identifier == -1) {
    return closing_tag;
  }
  return closing_identifier;
}

function createNewTagId() {
  return 'TG_1112223334445';
}

function getTagContent() {
  return {
    id: 'LO_1234567890124'
  };
}

function addAdditionalText(text, partition) {
  if (partition.type !== 'tag') {
    return text;
  }
  return '{' + text + '}(' + partition.id + ')';
}
