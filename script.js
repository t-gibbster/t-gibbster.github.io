$(document).ready(function(){
  
var xhr = new XMLHttpRequest();

xhr.open("GET", "http://www.codecademy.com/", false);
xhr.send();

console.log(xhr.status);
console.log(xhr.statusText);

$('#cityInfo').append(xhr.status, xhr.statusText)



});
