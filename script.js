$(document).ready(function(){


var displayGroups = function(result) {
    $('#demo').append(result)
  };

var y = $.get("https://api.meetup.com/find/locations?photo-host=public&query=94606&sig_id=182898232&sig=ffc85a4fa1e2ccc36b5936a85be2a84028c9c7ab", displayGroups);

});

