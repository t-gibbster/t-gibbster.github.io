$(document).ready(function(){
  
var x = function(result) {
  
  $('#cityInfo').append(result.gender)
  
};

var y = $.get('https://api.genderize.io/?name=peter', x);

//var xhr2 = new XMLHttpRequest();

//xhr2.open("GET", "https://api.meetup.com/find/locations?&sign=true&photo-host=public&query=94606", false);
//xhr2.send();

//$('#cityInfo').append(xhr2.status, xhr.statusText)

});
