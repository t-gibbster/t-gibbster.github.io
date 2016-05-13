$(document).ready(function(){
  
alert("hello?")  

var currentDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
var day = currentDate.getDate()
var month = currentDate.getMonth() + 1
var year = currentDate.getFullYear()


    $('tomorrow').append("<p>" + currentDate + "</p>");

  
});
